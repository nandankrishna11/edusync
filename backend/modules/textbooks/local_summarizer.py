"""
Local Summarization Service
Uses extractive summarization without external APIs
No API keys required - completely free and local
"""
import re
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class LocalSummarizer:
    """
    Extractive summarization using TF-IDF and sentence scoring
    No external dependencies, completely free
    """
    
    def __init__(self):
        """Initialize local summarizer"""
        self.stop_words = {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have', 'had',
            'what', 'when', 'where', 'who', 'which', 'why', 'how'
        }
    
    def summarize(self, text: str, max_sentences: int = 2) -> str:
        """
        Generate extractive summary from text
        
        Args:
            text: Input text to summarize
            max_sentences: Maximum number of sentences in summary
            
        Returns:
            Summary string
        """
        if not text or len(text.strip()) < 50:
            return text.strip()
        
        # Split into sentences
        sentences = self._split_sentences(text)
        
        if len(sentences) <= max_sentences:
            return text.strip()
        
        # Score sentences
        scores = self._score_sentences(sentences)
        
        # Get top sentences
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:max_sentences]
        top_indices.sort()  # Keep original order
        
        # Build summary
        summary = ' '.join([sentences[i] for i in top_indices])
        return summary.strip()
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting
        text = re.sub(r'\s+', ' ', text)
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        return sentences
    
    def _score_sentences(self, sentences: List[str]) -> List[float]:
        """Score sentences based on word frequency and position"""
        # Calculate word frequencies
        word_freq = {}
        for sentence in sentences:
            words = self._tokenize(sentence.lower())
            for word in words:
                if word not in self.stop_words and len(word) > 2:
                    word_freq[word] = word_freq.get(word, 0) + 1
        
        # Normalize frequencies
        max_freq = max(word_freq.values()) if word_freq else 1
        for word in word_freq:
            word_freq[word] = word_freq[word] / max_freq
        
        # Score sentences
        scores = []
        for i, sentence in enumerate(sentences):
            words = self._tokenize(sentence.lower())
            score = sum(word_freq.get(word, 0) for word in words if word not in self.stop_words)
            
            # Boost first sentence (often contains key info)
            if i == 0:
                score *= 1.5
            
            # Boost sentences with question words (often important)
            if any(word in sentence.lower() for word in ['what', 'how', 'why', 'when', 'where']):
                score *= 1.2
            
            # Boost sentences with numbers/formulas (often important in textbooks)
            if re.search(r'\d+', sentence):
                score *= 1.1
            
            scores.append(score)
        
        return scores
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple word tokenization"""
        return re.findall(r'\b\w+\b', text.lower())
    
    def generate_answer_summary(self, answer: str, query: str = None) -> str:
        """
        Generate a focused summary of an answer
        
        Args:
            answer: The full answer text
            query: Optional query to focus summary
            
        Returns:
            Concise summary
        """
        # If query provided, prioritize sentences mentioning query terms
        if query:
            query_terms = set(self._tokenize(query.lower())) - self.stop_words
            sentences = self._split_sentences(answer)
            
            # Score sentences with query term matching
            scored = []
            for sentence in sentences:
                sentence_terms = set(self._tokenize(sentence.lower()))
                overlap = len(query_terms & sentence_terms)
                scored.append((sentence, overlap))
            
            # Sort by overlap and take top sentences
            scored.sort(key=lambda x: x[1], reverse=True)
            top_sentences = [s[0] for s in scored[:2]]
            
            if top_sentences:
                return ' '.join(top_sentences)
        
        # Fallback to regular summarization
        return self.summarize(answer, max_sentences=2)
    
    def extract_key_points(self, text: str, max_points: int = 3) -> List[str]:
        """
        Extract key points as bullet points
        
        Args:
            text: Input text
            max_points: Maximum number of key points
            
        Returns:
            List of key point strings
        """
        sentences = self._split_sentences(text)
        
        if len(sentences) <= max_points:
            return sentences
        
        scores = self._score_sentences(sentences)
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:max_points]
        top_indices.sort()
        
        return [sentences[i] for i in top_indices]


class SmartAnswerGenerator:
    """
    Generate better answers from textbook chunks without LLM
    Uses template-based generation and extractive techniques
    """
    
    def __init__(self):
        self.summarizer = LocalSummarizer()
    
    def generate_answer(self, query: str, chunks: List[Dict]) -> str:
        """
        Generate a coherent answer from chunks
        
        Args:
            query: User's question
            chunks: Retrieved textbook chunks
            
        Returns:
            Formatted answer
        """
        if not chunks:
            return "I couldn't find relevant information in the textbooks."
        
        # Extract query type
        query_lower = query.lower()
        is_definition = any(word in query_lower for word in ['what is', 'define', 'definition'])
        is_how = 'how' in query_lower
        is_why = 'why' in query_lower
        is_list = any(word in query_lower for word in ['list', 'types', 'kinds', 'examples'])
        
        # Get most relevant chunk
        top_chunk = chunks[0]
        text = top_chunk['text']
        page = top_chunk['page']
        
        # Generate answer based on query type
        if is_definition:
            answer = self._generate_definition_answer(query, text, page)
        elif is_how:
            answer = self._generate_how_answer(query, text, page)
        elif is_why:
            answer = self._generate_why_answer(query, text, page)
        elif is_list:
            answer = self._generate_list_answer(query, text, page)
        else:
            answer = self._generate_general_answer(query, text, page)
        
        # Add additional context from other chunks if available
        if len(chunks) > 1:
            answer += "\n\n**Additional Information:**\n"
            for chunk in chunks[1:3]:  # Add up to 2 more chunks
                summary = self.summarizer.summarize(chunk['text'], max_sentences=1)
                answer += f"- {summary} (Page {chunk['page']})\n"
        
        return answer
    
    def _generate_definition_answer(self, query: str, text: str, page: int) -> str:
        """Generate definition-style answer"""
        sentences = self.summarizer._split_sentences(text)
        
        # Look for definition patterns
        for sentence in sentences:
            if any(pattern in sentence.lower() for pattern in ['is defined as', 'refers to', 'means', 'is a', 'is an']):
                return f"**Answer:** {sentence}\n\n**Source:** Page {page}"
        
        # Fallback: use first 2 sentences
        definition = ' '.join(sentences[:2])
        return f"**Answer:** {definition}\n\n**Source:** Page {page}"
    
    def _generate_how_answer(self, query: str, text: str, page: int) -> str:
        """Generate how-to style answer"""
        sentences = self.summarizer._split_sentences(text)
        
        # Look for process/steps
        steps = [s for s in sentences if any(word in s.lower() for word in ['first', 'then', 'next', 'finally', 'step'])]
        
        if steps:
            answer = "**Answer:**\n" + '\n'.join(f"• {step}" for step in steps[:4])
        else:
            answer = f"**Answer:** {' '.join(sentences[:3])}"
        
        return f"{answer}\n\n**Source:** Page {page}"
    
    def _generate_why_answer(self, query: str, text: str, page: int) -> str:
        """Generate explanation-style answer"""
        sentences = self.summarizer._split_sentences(text)
        
        # Look for causal/explanation patterns
        explanations = [s for s in sentences if any(word in s.lower() for word in ['because', 'due to', 'reason', 'therefore', 'thus'])]
        
        if explanations:
            answer = f"**Answer:** {' '.join(explanations[:2])}"
        else:
            answer = f"**Answer:** {' '.join(sentences[:2])}"
        
        return f"{answer}\n\n**Source:** Page {page}"
    
    def _generate_list_answer(self, query: str, text: str, page: int) -> str:
        """Generate list-style answer"""
        sentences = self.summarizer._split_sentences(text)
        
        # Look for enumeration patterns
        items = []
        for sentence in sentences:
            if re.search(r'\d+\.|•|–|-', sentence) or any(word in sentence.lower() for word in ['include', 'such as', 'example']):
                items.append(sentence)
        
        if items:
            answer = "**Answer:**\n" + '\n'.join(f"• {item}" for item in items[:5])
        else:
            answer = f"**Answer:** {' '.join(sentences[:3])}"
        
        return f"{answer}\n\n**Source:** Page {page}"
    
    def _generate_general_answer(self, query: str, text: str, page: int) -> str:
        """Generate general answer"""
        summary = self.summarizer.generate_answer_summary(text, query)
        return f"**Answer:** {summary}\n\n**Source:** Page {page}"
