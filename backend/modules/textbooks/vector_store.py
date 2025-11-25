"""
Vector Store Service
Manages ChromaDB for vector similarity search
"""
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self, persist_directory: str = "./chroma_db"):
        """Initialize ChromaDB client"""
        logger.info(f"Initializing ChromaDB at {persist_directory}")
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(anonymized_telemetry=False)
        )
    
    def create_collection(self, textbook_id: int) -> str:
        """Create a new collection for a textbook"""
        collection_name = f"textbook_{textbook_id}"
        try:
            # Delete if exists
            try:
                self.client.delete_collection(collection_name)
            except:
                pass
            
            collection = self.client.create_collection(
                name=collection_name,
                metadata={"textbook_id": textbook_id}
            )
            logger.info(f"Created collection: {collection_name}")
            return collection_name
        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            raise
    
    def add_chunks(
        self,
        collection_name: str,
        chunks: List[Dict],
        embeddings: List[List[float]]
    ):
        """Add chunks with embeddings to collection"""
        try:
            collection = self.client.get_collection(collection_name)
            
            ids = [f"chunk_{chunk['chunk_id']}" for chunk in chunks]
            documents = [chunk['text'] for chunk in chunks]
            metadatas = [
                {
                    "page": chunk['page'],
                    "token_count": chunk['token_count']
                }
                for chunk in chunks
            ]
            
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            logger.info(f"Added {len(chunks)} chunks to {collection_name}")
        except Exception as e:
            logger.error(f"Error adding chunks: {e}")
            raise
    
    def search(
        self,
        collection_names: List[str],
        query_embedding: List[float],
        top_k: int = 5
    ) -> List[Dict]:
        """
        Search across multiple collections
        Returns top_k most similar chunks
        """
        all_results = []
        
        for collection_name in collection_names:
            try:
                collection = self.client.get_collection(collection_name)
                results = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=min(top_k, 10)  # Get more from each collection
                )
                
                if results['ids'] and results['ids'][0]:
                    for i in range(len(results['ids'][0])):
                        all_results.append({
                            "collection": collection_name,
                            "chunk_id": results['ids'][0][i],
                            "text": results['documents'][0][i],
                            "page": results['metadatas'][0][i]['page'],
                            "distance": results['distances'][0][i],
                            "similarity": 1 - results['distances'][0][i]
                        })
            except Exception as e:
                logger.warning(f"Error searching collection {collection_name}: {e}")
        
        # Sort by similarity and return top_k
        all_results.sort(key=lambda x: x['similarity'], reverse=True)
        return all_results[:top_k]
    
    def delete_collection(self, collection_name: str):
        """Delete a collection"""
        try:
            self.client.delete_collection(collection_name)
            logger.info(f"Deleted collection: {collection_name}")
        except Exception as e:
            logger.error(f"Error deleting collection: {e}")
            raise
    
    def get_collection_count(self, collection_name: str) -> int:
        """Get number of items in collection"""
        try:
            collection = self.client.get_collection(collection_name)
            return collection.count()
        except:
            return 0
