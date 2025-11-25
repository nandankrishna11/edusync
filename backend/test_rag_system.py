"""
Test RAG System - Diagnose issues
"""
import sys
sys.path.append('.')

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models.models import Textbook, TextbookChunk, StudentSubjectOptIn, User
from modules.textbooks.embedding_service import EmbeddingService
from modules.textbooks.vector_store import VectorStore
from modules.textbooks.rag_service import RAGService

def test_rag_system():
    db = SessionLocal()
    
    print("=" * 60)
    print("RAG SYSTEM DIAGNOSTIC")
    print("=" * 60)
    
    # 1. Check textbooks
    print("\n1. CHECKING TEXTBOOKS...")
    textbooks = db.query(Textbook).all()
    print(f"   Total textbooks: {len(textbooks)}")
    
    for tb in textbooks:
        chunk_count = db.query(TextbookChunk).filter(TextbookChunk.textbook_id == tb.id).count()
        print(f"\n   Textbook ID: {tb.id}")
        print(f"   Title: {tb.title}")
        print(f"   Subject: {tb.subject_code}")
        print(f"   Status: {tb.processing_status}")
        print(f"   Vector Collection: {tb.vector_collection_id}")
        print(f"   Chunk Count: {chunk_count}")
    
    # 2. Check chunks
    print("\n2. CHECKING CHUNKS...")
    chunks = db.query(TextbookChunk).all()
    print(f"   Total chunks in database: {len(chunks)}")
    
    if chunks:
        sample = chunks[0]
        print(f"\n   Sample chunk:")
        print(f"   - Textbook ID: {sample.textbook_id}")
        print(f"   - Page: {sample.page_number}")
        text_content = getattr(sample, 'text', getattr(sample, 'content', 'N/A'))
        if text_content != 'N/A':
            print(f"   - Text preview: {text_content[:100]}...")
    
    # 3. Check student opt-ins
    print("\n3. CHECKING STUDENT OPT-INS...")
    opt_ins = db.query(StudentSubjectOptIn).filter(
        StudentSubjectOptIn.is_active == True
    ).all()
    print(f"   Active opt-ins: {len(opt_ins)}")
    
    for opt in opt_ins:
        print(f"   - Student: {opt.student_usn}, Subject: {opt.subject_code}")
    
    # 4. Test embedding service
    print("\n4. TESTING EMBEDDING SERVICE...")
    try:
        emb_service = EmbeddingService()
        test_query = "what is cloud computing"
        embedding = emb_service.generate_embedding(test_query)
        print(f"   ✓ Embedding generated successfully")
        print(f"   - Dimension: {len(embedding)}")
        print(f"   - Sample values: {embedding[:5]}")
    except Exception as e:
        print(f"   ✗ Embedding failed: {e}")
        return
    
    # 5. Test vector store
    print("\n5. TESTING VECTOR STORE...")
    try:
        vec_store = VectorStore()
        
        # Get collection names from textbooks
        completed_textbooks = db.query(Textbook).filter(
            Textbook.processing_status == "completed",
            Textbook.vector_collection_id != None
        ).all()
        
        print(f"   Completed textbooks with vectors: {len(completed_textbooks)}")
        
        if completed_textbooks:
            collection_names = [tb.vector_collection_id for tb in completed_textbooks]
            print(f"   Collections to search: {collection_names}")
            
            # Try search
            results = vec_store.search(collection_names, embedding, top_k=3)
            print(f"   ✓ Search completed")
            print(f"   - Results found: {len(results)}")
            
            if results:
                print(f"\n   Top result:")
                print(f"   - Collection: {results[0]['collection']}")
                print(f"   - Page: {results[0]['page']}")
                print(f"   - Similarity: {results[0]['similarity']:.4f}")
                print(f"   - Text preview: {results[0]['text'][:150]}...")
            else:
                print("   ⚠ No results found in vector search")
        else:
            print("   ⚠ No completed textbooks with vector collections")
    except Exception as e:
        print(f"   ✗ Vector store failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 6. Test RAG service
    print("\n6. TESTING RAG SERVICE...")
    try:
        rag_service = RAGService()
        
        if results:
            answer_result = rag_service.generate_answer(test_query, results)
            print(f"   ✓ Answer generated")
            print(f"\n   Answer: {answer_result['answer'][:200]}...")
            print(f"   Sources: {len(answer_result['sources'])}")
        else:
            print("   ⚠ Skipping RAG test (no search results)")
    except Exception as e:
        print(f"   ✗ RAG service failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)
    
    db.close()

if __name__ == "__main__":
    test_rag_system()
