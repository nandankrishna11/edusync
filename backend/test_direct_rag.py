"""
Test RAG directly without API
"""
import sys
sys.path.append('.')

from sqlalchemy.orm import Session
from database import SessionLocal
from models.models import Textbook, StudentSubjectOptIn
from modules.textbooks.embedding_service import EmbeddingService
from modules.textbooks.vector_store import VectorStore
from modules.textbooks.rag_service import RAGService

def test_student_query():
    db = SessionLocal()
    
    print("=" * 60)
    print("SIMULATING STUDENT QUERY: 'what is cloud computing'")
    print("=" * 60)
    
    # Student info
    student_usn = "4KV22CS090"
    query = "what is cloud computing"
    
    # 1. Get student's opted subjects
    print("\n1. Getting student's opted subjects...")
    opt_ins = db.query(StudentSubjectOptIn).filter(
        StudentSubjectOptIn.student_usn == student_usn,
        StudentSubjectOptIn.is_active == True
    ).all()
    
    subject_codes = [opt.subject_code for opt in opt_ins]
    print(f"   Student {student_usn} opted subjects: {subject_codes}")
    
    if not subject_codes:
        print("   ⚠ No subjects selected!")
        return
    
    # 2. Get textbooks for these subjects
    print("\n2. Getting textbooks for subjects...")
    textbooks = db.query(Textbook).filter(
        Textbook.subject_code.in_(subject_codes),
        Textbook.processing_status == "completed"
    ).all()
    
    print(f"   Found {len(textbooks)} textbooks")
    for tb in textbooks:
        print(f"   - {tb.title} (ID: {tb.id}, Collection: {tb.vector_collection_id})")
    
    if not textbooks:
        print("   ⚠ No textbooks available!")
        return
    
    # 3. Generate embedding
    print("\n3. Generating query embedding...")
    emb_service = EmbeddingService()
    query_embedding = emb_service.generate_embedding(query)
    print(f"   ✓ Embedding generated (dim: {len(query_embedding)})")
    
    # 4. Search vector store
    print("\n4. Searching vector store...")
    vec_store = VectorStore()
    collection_names = [tb.vector_collection_id for tb in textbooks if tb.vector_collection_id]
    print(f"   Searching collections: {collection_names}")
    
    search_results = vec_store.search(collection_names, query_embedding, top_k=5)
    print(f"   ✓ Found {len(search_results)} results")
    
    if search_results:
        print(f"\n   Top 3 results:")
        for i, result in enumerate(search_results[:3], 1):
            print(f"   {i}. Similarity: {result['similarity']:.4f}")
            print(f"      Collection: {result['collection']}")
            print(f"      Page: {result['page']}")
            print(f"      Text: {result['text'][:100]}...")
            print()
    
    # 5. Generate answer
    print("\n5. Generating answer...")
    rag_service = RAGService()
    result = rag_service.generate_answer(query, search_results)
    
    print(f"   ✓ Answer generated")
    print(f"\n   ANSWER:")
    print(f"   {result['answer']}")
    print(f"\n   SOURCES: {len(result['sources'])}")
    for source in result['sources']:
        print(f"   - Textbook {source['textbook_id']}, Page {source['page']}, Relevance: {source['relevance']}%")
    
    # 6. Generate summary
    print("\n6. Generating summary...")
    summary = rag_service.generate_summary(result['answer'])
    print(f"   SUMMARY: {summary}")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE - RAG SYSTEM WORKING!")
    print("=" * 60)
    
    db.close()

if __name__ == "__main__":
    test_student_query()
