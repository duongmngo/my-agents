"""
Text processing utilities for embedding operations
"""
import re
from typing import List, Optional
import hashlib


class TextProcessor:
    """Utility class for processing text before embedding"""
    
    def __init__(self):
        self.max_chunk_size = 1000  # Maximum characters per chunk
        self.overlap_size = 100     # Overlap between chunks
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove special characters that might interfere with embeddings
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}]', '', text)
        
        return text
    
    def split_text(self, text: str, chunk_size: Optional[int] = None) -> List[str]:
        """Split text into chunks for processing"""
        if not text:
            return []
        
        chunk_size = chunk_size or self.max_chunk_size
        chunks = []
        
        # Simple sentence-based splitting
        sentences = re.split(r'[.!?]+', text)
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # If adding this sentence would exceed chunk size, save current chunk
            if len(current_chunk) + len(sentence) > chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                current_chunk += " " + sentence if current_chunk else sentence
        
        # Add the last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def generate_content_hash(self, content: str) -> str:
        """Generate SHA256 hash of content for deduplication"""
        if not content:
            return ""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def extract_metadata(self, text: str) -> dict:
        """Extract basic metadata from text"""
        if not text:
            return {}
        
        # Estimate language (simple heuristic)
        language = self._detect_language(text)
        
        # Count words and characters
        word_count = len(text.split())
        char_count = len(text)
        
        # Detect content type
        content_type = self._detect_content_type(text)
        
        return {
            "language": language,
            "word_count": word_count,
            "char_count": char_count,
            "content_type": content_type,
            "estimated_reading_time": self._estimate_reading_time(word_count)
        }
    
    def _detect_language(self, text: str) -> str:
        """Simple language detection (basic heuristic)"""
        # This is a very basic heuristic - in production, use a proper language detection library
        text_lower = text.lower()
        
        # Check for common Vietnamese characters
        if any(char in text_lower for char in ['ă', 'â', 'ê', 'ô', 'ơ', 'ư', 'đ']):
            return "vi"
        
        # Check for common English words
        english_words = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of']
        if any(word in text_lower for word in english_words):
            return "en"
        
        return "unknown"
    
    def _detect_content_type(self, text: str) -> str:
        """Detect the type of content"""
        text_lower = text.lower()
        
        # Check for code indicators
        if any(indicator in text_lower for indicator in ['function', 'class', 'def ', 'import ', 'const ', 'let ', 'var ']):
            return "code"
        
        # Check for technical documentation
        if any(indicator in text_lower for indicator in ['api', 'endpoint', 'parameter', 'response', 'error']):
            return "technical_doc"
        
        # Check for conversation
        if any(indicator in text_lower for indicator in ['user:', 'assistant:', 'human:', 'ai:']):
            return "conversation"
        
        return "general"
    
    def _estimate_reading_time(self, word_count: int) -> int:
        """Estimate reading time in minutes (average 200 words per minute)"""
        return max(1, round(word_count / 200))
    
    def normalize_text(self, text: str) -> str:
        """Normalize text for consistent processing"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove punctuation (keep basic structure)
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract potential keywords from text"""
        if not text:
            return []
        
        # Normalize text
        normalized = self.normalize_text(text)
        
        # Split into words
        words = normalized.split()
        
        # Filter out common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        # Count frequency
        word_freq = {}
        for word in keywords:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency and return top keywords
        sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_keywords[:max_keywords]]
