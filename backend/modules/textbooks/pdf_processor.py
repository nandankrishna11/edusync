"""
PDF Processing Service
Handles text extraction and chunking from PDF files
"""
import pdfplumber
import re
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class PDFProcessor:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        """
        Initialize PDF processor
        
        Args:
            chunk_size: Number of words per chunk
            chunk_overlap: Number of overlapping words between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def extract_text_with_pages(self, pdf_path: str) -> List[Dict]:
        """
        Extract text from PDF with page numbers
        
        Returns:
            List of dicts: [{"page": 1, "text": "..."}, ...]
        """
        pages = []
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for i, page in enumerate(pdf.pages, start=1):
                    text = page.extract_text()
                    if text:
                        cleaned_text = self.clean_text(text)
                        if cleaned_text:  # Only add non-empty pages
                            pages.append({
                                "page": i,
                                "text": cleaned_text
                            })
            logger.info(f"Extracted text from {len(pages)} pages")
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
        
        return pages
    
    def clean_text(self, text: str) -> str:
        """Remove extra whitespace and special characters"""
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s.,;:!?()\-\'\"]+', '', text)
        text = text.strip()
        return text
    
    def chunk_text(self, pages: List[Dict]) -> List[Dict]:
        """
        Split text into chunks with overlap
        Preserves page numbers for citation
        
        Returns:
            List of chunks with metadata
        """
        chunks = []
        chunk_id = 0
        
        for page_data in pages:
            page_num = page_data["page"]
            text = page_data["text"]
            words = text.split()
            
            # Skip empty pages
            if not words:
                continue
            
            # Create chunks with overlap
            for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
                chunk_words = words[i:i + self.chunk_size]
                chunk_text = " ".join(chunk_words)
                
                chunks.append({
                    "chunk_id": chunk_id,
                    "page": page_num,
                    "text": chunk_text,
                    "token_count": len(chunk_words)
                })
                chunk_id += 1
        
        logger.info(f"Created {len(chunks)} chunks from {len(pages)} pages")
        return chunks
    
    def get_pdf_metadata(self, pdf_path: str) -> Dict:
        """Extract PDF metadata"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                return {
                    "page_count": len(pdf.pages),
                    "metadata": pdf.metadata or {}
                }
        except Exception as e:
            logger.error(f"Error getting PDF metadata: {e}")
            return {"page_count": 0, "metadata": {}}
