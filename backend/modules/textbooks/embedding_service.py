"""
Embedding Service
Generates vector embeddings for text using Sentence Transformers
"""
from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
import logging

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize embedding model
        
        Options:
        - all-MiniLM-L6-v2 (fast, 384 dimensions) - DEFAULT
        - all-mpnet-base-v2 (better quality, 768 dimensions)
        """
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        logger.info(f"Model loaded. Embedding dimension: {self.dimension}")
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    def generate_embeddings_batch(
        self, 
        texts: List[str], 
        batch_size: int = 32,
        show_progress: bool = True
    ) -> List[List[float]]:
        """Generate embeddings for multiple texts efficiently"""
        try:
            logger.info(f"Generating embeddings for {len(texts)} texts")
            embeddings = self.model.encode(
                texts,
                batch_size=batch_size,
                show_progress_bar=show_progress,
                convert_to_numpy=True
            )
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            raise
    
    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Compute cosine similarity between two embeddings"""
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))
