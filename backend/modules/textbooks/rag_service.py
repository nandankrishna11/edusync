"""
RAG Service
Generates answers using retrieved context and LLM
"""
from typing import List, Dict
import logging
import os

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(self, api_key: str = None):
        """Initialize RAG service with OpenAI client or local fallback"""
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.use_openai = bool(self.api_key)
        
        # Initialize local summarizer (always available)
        try:
            from .local_summarizer import LocalSummarizer, SmartAnswerGenerator
            self.local_summarizer = LocalSummarizer()
            self.smart_generator = SmartAnswerGenerator()
            logger.info("Local summarizer initialized")
        except Exception as e:
            logger.warning(f"Local summarizer initialization failed: {e}")
            self.local_summarizer = None
            self.smart_generator = None
        
        if self.use_openai:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
                logger.info("OpenAI client initialized")
            except ImportError:
                logger.warning("OpenAI package not installed. Using local mode.")
                self.use_openai = False
        else:
            logger.info("Using local summarization (no API key needed)")
    
    def generate_answer_with_context(
        self,
        query: str,
        context_chunks: List[Dict],
        conversation_context: List[Dict] = None,
        model: str = "gpt-3.5-turbo"
    ) -> Dict:
        """Generate answer with conversation history"""
        if not context_chunks:
            return {
                "answer": "I couldn't find relevant information in the textbooks. Try rephrasing or selecting different subjects.",
                "sources": []
            }
        
        sources = self._format_sources(context_chunks)
        
        if self.use_openai:
            try:
                answer = self._generate_with_openai_context(query, context_chunks, conversation_context or [], model)
            except Exception as e:
                logger.error(f"OpenAI generation failed: {e}")
                answer = self._generate_fallback(query, context_chunks)
        else:
            answer = self._generate_fallback(query, context_chunks)
        
        return {"answer": answer, "sources": sources}
    
    def generate_answer(
        self,
        query: str,
        context_chunks: List[Dict],
        model: str = "gpt-3.5-turbo"
    ) -> Dict:
        """
        Generate answer using RAG
        
        Args:
            query: User's question
            context_chunks: Retrieved relevant chunks from vector search
            model: OpenAI model to use
        
        Returns:
            {
                "answer": "Generated answer text",
                "sources": [{"textbook_id": 1, "page": 123, "excerpt": "...", "relevance": 0.95}]
            }
        """
        if not context_chunks:
            return {
                "answer": "I couldn't find any relevant information in the textbooks to answer your question.",
                "sources": []
            }
        
        # Format sources
        sources = self._format_sources(context_chunks)
        
        # Generate answer
        if self.use_openai:
            try:
                answer = self._generate_with_openai(query, context_chunks, model)
            except Exception as e:
                logger.error(f"OpenAI generation failed: {e}")
                answer = self._generate_fallback(query, context_chunks)
        else:
            answer = self._generate_fallback(query, context_chunks)
        
        return {
            "answer": answer,
            "sources": sources
        }
    
    def _generate_with_openai_context(
        self,
        query: str,
        context_chunks: List[Dict],
        conversation_context: List[Dict],
        model: str
    ) -> str:
        """Generate answer using OpenAI with conversation context"""
        context = self._build_context(context_chunks)
        
        messages = [
            {
                "role": "system",
                "content": "You are an educational assistant. Answer ONLY from the provided textbook excerpts. Do not invent facts. Use concise undergraduate-level language. Include inline citations [Title, p.X]. If sources are insufficient, say 'I couldn't find an authoritative answer in the provided textbooks.'"
            }
        ]
        
        # Add conversation history
        for msg in conversation_context[-4:]:  # Last 4 messages for context
            messages.append(msg)
        
        # Add current query with sources
        prompt = f"""Based on the following textbook excerpts, answer this question:

Question: {query}

Textbook Excerpts:
{context}

Answer:"""
        
        messages.append({"role": "user", "content": prompt})
        
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            max_tokens=500
        )
        
        return response.choices[0].message.content
    
    def _generate_with_openai(
        self,
        query: str,
        context_chunks: List[Dict],
        model: str
    ) -> str:
        """Generate answer using OpenAI"""
        context = self._build_context(context_chunks)
        prompt = self._create_prompt(query, context)
        
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful academic assistant. Answer questions based ONLY on the provided textbook excerpts. If the answer is not in the excerpts, say so. Cite page numbers when possible. Be concise and clear."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        return response.choices[0].message.content
    
    def _generate_fallback(self, query: str, context_chunks: List[Dict]) -> str:
        """Generate answer using local smart generator"""
        # Use smart generator if available
        if self.smart_generator:
            try:
                return self.smart_generator.generate_answer(query, context_chunks)
            except Exception as e:
                logger.error(f"Smart generator failed: {e}")
        
        # Ultimate fallback: simple excerpt
        top_chunk = context_chunks[0]
        page = top_chunk['page']
        
        # Create a simple response
        answer = f"Based on the textbook content (Page {page}), here's what I found:\n\n"
        answer += top_chunk['text'][:400]
        
        if len(top_chunk['text']) > 400:
            answer += "..."
        
        return answer
    
    def _build_context(self, chunks: List[Dict]) -> str:
        """Build context string from chunks"""
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            context_parts.append(
                f"[Source {i} - Page {chunk['page']}]\n{chunk['text']}\n"
            )
        return "\n".join(context_parts)
    
    def _create_prompt(self, query: str, context: str) -> str:
        """Create the RAG prompt"""
        return f"""Based on the following textbook excerpts, answer this question:

Question: {query}

Textbook Excerpts:
{context}

Answer:"""
    
    def generate_summary(self, answer: str, model: str = "gpt-3.5-turbo") -> str:
        """Generate a concise summary of the answer"""
        # Try OpenAI first if available
        if self.use_openai:
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a summarization expert. Create a concise 1-2 sentence summary that captures the key point. Be direct and clear."
                        },
                        {
                            "role": "user",
                            "content": f"Summarize this answer in 1-2 sentences:\n\n{answer}"
                        }
                    ],
                    temperature=0.3,
                    max_tokens=100
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.error(f"OpenAI summary generation failed: {e}")
        
        # Use local summarizer
        if self.local_summarizer:
            try:
                # Clean answer (remove markdown formatting for better summarization)
                clean_answer = answer.replace('**', '').replace('*', '')
                summary = self.local_summarizer.summarize(clean_answer, max_sentences=2)
                return summary
            except Exception as e:
                logger.error(f"Local summarization failed: {e}")
        
        # Ultimate fallback: simple sentence extraction
        sentences = answer.split('. ')
        return '. '.join(sentences[:2]) + '.' if len(sentences) > 1 else answer
    
    def _format_sources(self, chunks: List[Dict]) -> List[Dict]:
        """Format chunks as source citations"""
        sources = []
        for i, chunk in enumerate(chunks, 1):
            # Extract textbook info from collection name
            textbook_id = chunk['collection'].replace('textbook_', '')
            
            # Truncate excerpt
            excerpt = chunk['text']
            if len(excerpt) > 300:
                excerpt = excerpt[:300] + "..."
            
            sources.append({
                "index": i,
                "textbook_id": int(textbook_id),
                "page": chunk['page'],
                "excerpt": excerpt,
                "relevance": round(chunk['similarity'] * 100, 1)
            })
        return sources
