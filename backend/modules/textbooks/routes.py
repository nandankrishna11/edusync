"""
Textbook RAG API Routes
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
import json
import logging

from database import get_db
from models.models import Textbook, TextbookChunk, TextbookSearch, SavedAnswer, User
from modules.auth.services import get_current_user
from .pdf_processor import PDFProcessor
from .embedding_service import EmbeddingService
from .vector_store import VectorStore
from .rag_service import RAGService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/textbooks", tags=["textbooks"])

# Initialize services (singleton pattern)
pdf_processor = PDFProcessor()
embedding_service = None
vector_store = None
rag_service = None

def get_services():
    """Lazy initialization of services"""
    global embedding_service, vector_store, rag_service
    
    if embedding_service is None:
        embedding_service = EmbeddingService()
    if vector_store is None:
        vector_store = VectorStore()
    if rag_service is None:
        rag_service = RAGService()
    
    return embedding_service, vector_store, rag_service


@router.post("/upload")
async def upload_textbook(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject_code: Optional[str] = Form(None),
    department_code: Optional[str] = Form(None),
    semester: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a PDF textbook and start processing"""
    
    # Validate user is professor or admin
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Only professors can upload textbooks")
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Validate file size (100MB max)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > 100 * 1024 * 1024:  # 100MB
        raise HTTPException(status_code=400, detail="File size exceeds 100MB limit")
    
    try:
        # Create upload directory if not exists
        upload_dir = "backend/uploads/pdfs"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(upload_dir, safe_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get PDF metadata
        metadata = pdf_processor.get_pdf_metadata(file_path)
        
        # Create database record
        textbook = Textbook(
            title=title,
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            page_count=metadata.get("page_count", 0),
            subject_code=subject_code,
            department_code=department_code,
            semester=semester,
            uploaded_by=current_user.user_id,
            processing_status="pending"
        )
        
        db.add(textbook)
        db.commit()
        db.refresh(textbook)
        
        # Start processing in background (for now, process synchronously)
        try:
            process_textbook(textbook.id, file_path, db)
        except Exception as e:
            logger.error(f"Error processing textbook: {e}")
            textbook.processing_status = "failed"
            db.commit()
            raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
        
        return {
            "id": textbook.id,
            "title": textbook.title,
            "status": textbook.processing_status,
            "message": "Textbook uploaded and processing started"
        }
    
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def process_textbook(textbook_id: int, file_path: str, db: Session):
    """Process textbook: extract, chunk, embed, index"""
    
    textbook = db.query(Textbook).filter(Textbook.id == textbook_id).first()
    if not textbook:
        return
    
    try:
        # Update status
        textbook.processing_status = "processing"
        db.commit()
        
        # Extract text
        logger.info(f"Extracting text from textbook {textbook_id}")
        pages = pdf_processor.extract_text_with_pages(file_path)
        
        # Chunk text
        logger.info(f"Chunking text for textbook {textbook_id}")
        chunks = pdf_processor.chunk_text(pages)
        
        textbook.total_chunks = len(chunks)
        db.commit()
        
        # Generate embeddings
        logger.info(f"Generating embeddings for textbook {textbook_id}")
        emb_service, vec_store, _ = get_services()
        
        chunk_texts = [chunk['text'] for chunk in chunks]
        embeddings = emb_service.generate_embeddings_batch(chunk_texts, show_progress=False)
        
        # Create vector collection
        logger.info(f"Creating vector collection for textbook {textbook_id}")
        collection_name = vec_store.create_collection(textbook_id)
        textbook.vector_collection_id = collection_name
        
        # Add to vector store
        logger.info(f"Adding chunks to vector store for textbook {textbook_id}")
        vec_store.add_chunks(collection_name, chunks, embeddings)
        
        # Save chunks to database
        for chunk in chunks:
            db_chunk = TextbookChunk(
                textbook_id=textbook_id,
                chunk_index=chunk['chunk_id'],
                page_number=chunk['page'],
                content=chunk['text'],
                token_count=chunk['token_count'],
                embedding_id=f"chunk_{chunk['chunk_id']}"
            )
            db.add(db_chunk)
        
        # Update status
        textbook.indexed_chunks = len(chunks)
        textbook.processing_status = "completed"
        db.commit()
        
        logger.info(f"Successfully processed textbook {textbook_id}")
    
    except Exception as e:
        logger.error(f"Error processing textbook {textbook_id}: {e}")
        textbook.processing_status = "failed"
        db.commit()
        raise


@router.get("/list")
async def list_textbooks(
    subject_code: Optional[str] = None,
    department_code: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List textbooks accessible to the user"""
    
    query = db.query(Textbook)
    
    # Filter based on role
    if current_user.role == "student":
        # Students see textbooks for their department
        if current_user.department_code:
            query = query.filter(Textbook.department_code == current_user.department_code)
    elif current_user.role == "professor":
        # Professors see their own uploads
        query = query.filter(Textbook.uploaded_by == current_user.user_id)
    
    # Apply additional filters
    if subject_code:
        query = query.filter(Textbook.subject_code == subject_code)
    if department_code:
        query = query.filter(Textbook.department_code == department_code)
    
    textbooks = query.order_by(Textbook.upload_date.desc()).all()
    
    return [
        {
            "id": tb.id,
            "title": tb.title,
            "filename": tb.filename,
            "file_size": tb.file_size,
            "page_count": tb.page_count,
            "subject_code": tb.subject_code,
            "department_code": tb.department_code,
            "semester": tb.semester,
            "uploaded_by": tb.uploaded_by,
            "upload_date": tb.upload_date.isoformat() if tb.upload_date else None,
            "processing_status": tb.processing_status,
            "total_chunks": tb.total_chunks,
            "indexed_chunks": tb.indexed_chunks
        }
        for tb in textbooks
    ]


@router.get("/{textbook_id}")
async def get_textbook(
    textbook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get textbook details"""
    
    textbook = db.query(Textbook).filter(Textbook.id == textbook_id).first()
    if not textbook:
        raise HTTPException(status_code=404, detail="Textbook not found")
    
    return {
        "id": textbook.id,
        "title": textbook.title,
        "filename": textbook.filename,
        "file_size": textbook.file_size,
        "page_count": textbook.page_count,
        "subject_code": textbook.subject_code,
        "department_code": textbook.department_code,
        "semester": textbook.semester,
        "uploaded_by": textbook.uploaded_by,
        "upload_date": textbook.upload_date.isoformat() if textbook.upload_date else None,
        "processing_status": textbook.processing_status,
        "total_chunks": textbook.total_chunks,
        "indexed_chunks": textbook.indexed_chunks
    }


@router.delete("/{textbook_id}")
async def delete_textbook(
    textbook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete textbook (professors only)"""
    
    textbook = db.query(Textbook).filter(Textbook.id == textbook_id).first()
    if not textbook:
        raise HTTPException(status_code=404, detail="Textbook not found")
    
    # Check permissions
    if current_user.role == "professor" and textbook.uploaded_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own textbooks")
    elif current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Only professors can delete textbooks")
    
    try:
        # Delete vector collection
        if textbook.vector_collection_id:
            _, vec_store, _ = get_services()
            vec_store.delete_collection(textbook.vector_collection_id)
        
        # Delete file
        if os.path.exists(textbook.file_path):
            os.remove(textbook.file_path)
        
        # Delete chunks
        db.query(TextbookChunk).filter(TextbookChunk.textbook_id == textbook_id).delete()
        
        # Delete textbook
        db.delete(textbook)
        db.commit()
        
        return {"message": "Textbook deleted successfully"}
    
    except Exception as e:
        logger.error(f"Error deleting textbook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_textbooks(
    query: str = Form(...),
    textbook_ids: Optional[str] = Form(None),
    subject_code: Optional[str] = Form(None),
    top_k: int = Form(5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """RAG-based search across textbooks"""
    
    try:
        # Get services
        emb_service, vec_store, rag_svc = get_services()
        
        # Determine which textbooks to search
        textbook_query = db.query(Textbook).filter(Textbook.processing_status == "completed")
        
        if textbook_ids:
            ids = [int(id.strip()) for id in textbook_ids.split(",")]
            textbook_query = textbook_query.filter(Textbook.id.in_(ids))
        elif subject_code:
            textbook_query = textbook_query.filter(Textbook.subject_code == subject_code)
        elif current_user.role == "student" and current_user.department_code:
            textbook_query = textbook_query.filter(Textbook.department_code == current_user.department_code)
        
        textbooks = textbook_query.all()
        
        if not textbooks:
            return {
                "answer": "No textbooks available for search.",
                "sources": [],
                "query": query
            }
        
        # Generate query embedding
        query_embedding = emb_service.generate_embedding(query)
        
        # Search vector store
        collection_names = [tb.vector_collection_id for tb in textbooks if tb.vector_collection_id]
        search_results = vec_store.search(collection_names, query_embedding, top_k)
        
        # Generate answer using RAG
        result = rag_svc.generate_answer(query, search_results)
        
        # Enrich sources with textbook info
        for source in result['sources']:
            textbook = db.query(Textbook).filter(Textbook.id == source['textbook_id']).first()
            if textbook:
                source['textbook_title'] = textbook.title
                source['subject_code'] = textbook.subject_code
        
        # Save search history
        search_record = TextbookSearch(
            user_id=current_user.user_id,
            query=query,
            textbook_ids=textbook_ids or "",
            subject_code=subject_code,
            result_count=len(result['sources']),
            answer=result['answer'],
            sources=json.dumps(result['sources'])
        )
        db.add(search_record)
        db.commit()
        
        return {
            "answer": result['answer'],
            "sources": result['sources'],
            "query": query,
            "search_id": search_record.id
        }
    
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/history")
async def get_search_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's recent searches"""
    
    searches = db.query(TextbookSearch).filter(
        TextbookSearch.user_id == current_user.user_id
    ).order_by(TextbookSearch.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": s.id,
            "query": s.query,
            "result_count": s.result_count,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in searches
    ]


@router.post("/search/{search_id}/feedback")
async def submit_feedback(
    search_id: int,
    feedback: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit feedback on search result"""
    
    search = db.query(TextbookSearch).filter(
        TextbookSearch.id == search_id,
        TextbookSearch.user_id == current_user.user_id
    ).first()
    
    if not search:
        raise HTTPException(status_code=404, detail="Search not found")
    
    search.feedback = feedback
    db.commit()
    
    return {"message": "Feedback submitted"}


@router.get("/{textbook_id}/pdf")
async def get_pdf(
    textbook_id: int,
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Serve PDF file - supports query param authentication for browser viewing"""
    from modules.auth.services import verify_token
    from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
    from fastapi import Request
    
    # Try to get token from query param or header
    auth_token = token
    if not auth_token:
        # Try to get from Authorization header
        try:
            from modules.auth.services import get_current_user
            # This will raise exception if not authenticated
            current_user = await get_current_user(token=None, db=db)
        except:
            raise HTTPException(status_code=401, detail="Not authenticated")
    else:
        # Validate token from query param
        try:
            from jose import jwt
            from core.config import settings
            payload = jwt.decode(auth_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise HTTPException(status_code=401, detail="Invalid token")
        except:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    textbook = db.query(Textbook).filter(Textbook.id == textbook_id).first()
    if not textbook:
        raise HTTPException(status_code=404, detail="Textbook not found")
    
    if not os.path.exists(textbook.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    return FileResponse(
        textbook.file_path,
        media_type="application/pdf",
        filename=textbook.filename
    )
