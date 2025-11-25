"""
RAG Chat API Routes
Subject-scoped conversational AI for students
"""
from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime

from database import get_db
from models.models import (
    User, Textbook, ChatSession, ChatMessage, 
    StudentSubjectOptIn, SubjectMaster
)
from modules.auth.services import get_current_user
from .embedding_service import EmbeddingService
from .vector_store import VectorStore
from .rag_service import RAGService

router = APIRouter(prefix="/api/rag", tags=["rag-chat"])

# Initialize services
embedding_service = None
vector_store = None
rag_service = None

def get_services():
    global embedding_service, vector_store, rag_service
    if embedding_service is None:
        embedding_service = EmbeddingService()
    if vector_store is None:
        vector_store = VectorStore()
    if rag_service is None:
        rag_service = RAGService()
    return embedding_service, vector_store, rag_service


@router.get("/subjects")
async def get_student_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get subjects student has opted into"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    
    # Get opted-in subjects
    opt_ins = db.query(StudentSubjectOptIn).filter(
        StudentSubjectOptIn.student_usn == current_user.student_usn,
        StudentSubjectOptIn.is_active == True
    ).all()
    
    opted_subject_codes = [opt.subject_code for opt in opt_ins]
    
    # Get all available subjects - if student has department, filter by it, otherwise show all
    query = db.query(SubjectMaster).filter(SubjectMaster.is_active == True)
    
    if current_user.department_code:
        query = query.filter(SubjectMaster.department_code == current_user.department_code)
    
    available_subjects = query.all()
    
    return {
        "opted_subjects": [
            {
                "subject_code": opt.subject_code,
                "opted_in_at": opt.opted_in_at.isoformat() if opt.opted_in_at else None
            }
            for opt in opt_ins
        ],
        "available_subjects": [
            {
                "subject_code": subj.subject_code,
                "subject_name": subj.subject_name,
                "semester": subj.semester,
                "department_code": subj.department_code,
                "is_opted_in": subj.subject_code in opted_subject_codes
            }
            for subj in available_subjects
        ]
    }


@router.post("/subjects/opt-in")
async def opt_in_subjects(
    subject_codes: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Opt into subjects for RAG chat"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can opt-in")
    
    # Validate subjects exist
    query = db.query(SubjectMaster).filter(
        SubjectMaster.subject_code.in_(subject_codes),
        SubjectMaster.is_active == True
    )
    
    # If student has department, prefer subjects from their department
    if current_user.department_code:
        query = query.filter(SubjectMaster.department_code == current_user.department_code)
    
    valid_subjects = query.all()
    
    if len(valid_subjects) != len(subject_codes):
        raise HTTPException(status_code=400, detail="Invalid subject codes")
    
    # Deactivate all current opt-ins
    db.query(StudentSubjectOptIn).filter(
        StudentSubjectOptIn.student_usn == current_user.student_usn
    ).update({"is_active": False, "opted_out_at": datetime.now()})
    
    # Create new opt-ins
    for subject_code in subject_codes:
        opt_in = StudentSubjectOptIn(
            student_usn=current_user.student_usn,
            subject_code=subject_code,
            is_active=True
        )
        db.add(opt_in)
    
    db.commit()
    
    return {"message": "Subjects updated successfully", "opted_subjects": subject_codes}


@router.post("/ask")
async def ask_question(
    query: str = Form(...),
    subject_codes: Optional[str] = Form(None),
    session_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ask a question with RAG (conversational)"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"RAG Query from {current_user.user_id}: {query}")
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can ask questions")
    
    # Parse subject_codes if provided as comma-separated string
    subject_code_list = None
    if subject_codes:
        if isinstance(subject_codes, str):
            subject_code_list = [code.strip() for code in subject_codes.split(',') if code.strip()]
        else:
            subject_code_list = subject_codes
    
    logger.info(f"Parsed subject codes: {subject_code_list}")
    
    # Get student's opted subjects if not specified
    if not subject_code_list:
        opt_ins = db.query(StudentSubjectOptIn).filter(
            StudentSubjectOptIn.student_usn == current_user.student_usn,
            StudentSubjectOptIn.is_active == True
        ).all()
        subject_code_list = [opt.subject_code for opt in opt_ins]
    
    if not subject_code_list:
        return {
            "session_id": None,
            "answer": "Please select subjects first! Go to 'My Subjects' to choose which subjects you want to search. Once you've selected your subjects, you can ask questions about your textbooks.",
            "summary": "No subjects selected yet.",
            "sources": [],
            "query": query
        }
    
    # Validate student has access to these subjects
    student_subjects = db.query(StudentSubjectOptIn).filter(
        StudentSubjectOptIn.student_usn == current_user.student_usn,
        StudentSubjectOptIn.subject_code.in_(subject_code_list),
        StudentSubjectOptIn.is_active == True
    ).all()
    
    if len(student_subjects) != len(subject_code_list):
        raise HTTPException(status_code=403, detail="Access denied to one or more subjects")
    
    # Get or create session
    if session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.student_usn == current_user.student_usn
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session = ChatSession(
            student_usn=current_user.student_usn,
            subject_codes=json.dumps(subject_code_list),
            title=query[:100]  # First query as title
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    
    # Get conversation context (last 5 messages)
    context_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.timestamp.desc()).limit(5).all()
    context_messages.reverse()  # Chronological order
    
    # Get textbooks for these subjects
    textbooks = db.query(Textbook).filter(
        Textbook.subject_code.in_(subject_code_list),
        Textbook.processing_status == "completed"
    ).all()
    
    if not textbooks:
        return {
            "session_id": session.id,
            "answer": "No textbooks are available for the selected subjects yet. Please ask your professor to upload course materials.",
            "sources": [],
            "query": query
        }
    
    # Generate embedding and search
    emb_service, vec_store, rag_svc = get_services()
    query_embedding = emb_service.generate_embedding(query)
    
    collection_names = [tb.vector_collection_id for tb in textbooks if tb.vector_collection_id]
    search_results = vec_store.search(collection_names, query_embedding, top_k=5)
    
    # Build conversation context for LLM
    conversation_context = [
        {"role": "user" if msg.sender == "user" else "assistant", "content": msg.content}
        for msg in context_messages
    ]
    
    # Generate answer with conversation context
    result = rag_svc.generate_answer_with_context(query, search_results, conversation_context)
    
    # Generate summary
    summary = rag_svc.generate_summary(result['answer'])
    result['summary'] = summary
    
    # Enrich sources with textbook info
    for source in result['sources']:
        textbook = db.query(Textbook).filter(Textbook.id == source['textbook_id']).first()
        if textbook:
            source['textbook_title'] = textbook.title
            source['subject_code'] = textbook.subject_code
    
    # Save messages
    user_message = ChatMessage(
        session_id=session.id,
        sender="user",
        content=query
    )
    db.add(user_message)
    
    assistant_message = ChatMessage(
        session_id=session.id,
        sender="assistant",
        content=result['answer'],
        summary=result.get('summary', ''),
        sources=json.dumps(result['sources'])
    )
    db.add(assistant_message)
    
    # Update session
    session.message_count += 2
    session.last_message_at = datetime.now()
    
    db.commit()
    
    response_data = {
        "session_id": session.id,
        "answer": result['answer'],
        "summary": result.get('summary', ''),
        "sources": result['sources'],
        "query": query
    }
    
    logger.info(f"Returning response with {len(result['sources'])} sources")
    logger.info(f"Answer length: {len(result['answer'])} chars")
    
    return response_data


@router.get("/sessions")
async def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get student's chat sessions"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    
    sessions = db.query(ChatSession).filter(
        ChatSession.student_usn == current_user.student_usn
    ).order_by(ChatSession.last_message_at.desc()).all()
    
    return [
        {
            "id": session.id,
            "title": session.title,
            "subject_codes": json.loads(session.subject_codes),
            "message_count": session.message_count,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "last_message_at": session.last_message_at.isoformat() if session.last_message_at else None
        }
        for session in sessions
    ]


@router.get("/sessions/{session_id}")
async def get_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat session with messages"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.student_usn == current_user.student_usn
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.timestamp).all()
    
    return {
        "id": session.id,
        "title": session.title,
        "subject_codes": json.loads(session.subject_codes),
        "message_count": session.message_count,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "last_message_at": session.last_message_at.isoformat() if session.last_message_at else None,
        "messages": [
            {
                "id": msg.id,
                "sender": msg.sender,
                "content": msg.content,
                "summary": msg.summary if hasattr(msg, 'summary') else None,
                "sources": json.loads(msg.sources) if msg.sources else [],
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
            }
            for msg in messages
        ]
    }


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a chat session"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can delete sessions")
    
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.student_usn == current_user.student_usn
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Delete messages
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    
    # Delete session
    db.delete(session)
    db.commit()
    
    return {"message": "Session deleted successfully"}
