"""
Text Chunking Utility for Embedding Operations

Splits large documents into semantic chunks for vector embedding.
Each chunk maintains metadata for source tracking and citation.

Why chunking is needed:
1. Embedding model context limits (e.g., ~8192 tokens for OpenAI)
2. Semantic precision - smaller chunks have more focused meaning
3. Better retrieval accuracy - find specific information in large docs
4. Cost optimization - process relevant chunks, not entire documents
"""
import re
import uuid
import hashlib
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)

# Namespace UUID for generating deterministic chunk IDs
CHUNK_NAMESPACE = uuid.UUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')


@dataclass
class ChunkResult:
    """Represents a single chunk with its metadata"""
    content: str
    chunk_index: int
    total_chunks: int
    char_start: int
    char_end: int
    source_id: str
    source_type: str
    chunk_id: str
    is_chunk: bool
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "content": self.content,
            "chunk_index": self.chunk_index,
            "total_chunks": self.total_chunks,
            "char_start": self.char_start,
            "char_end": self.char_end,
            "source_id": self.source_id,
            "source_type": self.source_type,
            "chunk_id": self.chunk_id,
            "is_chunk": self.is_chunk,
            "metadata": self.metadata,
        }


class TextChunker:
    """
    Split text into semantic chunks for embedding with metadata tracking.
    
    Features:
    - Respects semantic boundaries (paragraphs, sentences)
    - Configurable chunk size and overlap
    - Tracks character positions for highlighting
    - Generates unique chunk IDs
    - Maintains parent document reference
    
    Usage:
        chunker = TextChunker(chunk_size=1000, chunk_overlap=200)
        chunks = chunker.chunk_text(
            text="Long document content...",
            source_id="note-123",
            source_type="note",
            metadata={"note_title": "My Note"}
        )
        
        for chunk in chunks:
            # Store each chunk as separate embedding
            await store_embedding(chunk.content, chunk.to_dict())
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        min_chunk_size: int = 100,
        respect_sentences: bool = True,
    ):
        """
        Initialize the text chunker.
        
        Args:
            chunk_size: Target size for each chunk in characters (default: 1000)
            chunk_overlap: Overlap between consecutive chunks (default: 200)
            min_chunk_size: Minimum size for a chunk to be valid (default: 100)
            respect_sentences: Try to break at sentence boundaries (default: True)
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.respect_sentences = respect_sentences
        
        # Validate settings
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be less than chunk_size")
        if min_chunk_size > chunk_size:
            raise ValueError("min_chunk_size must be less than or equal to chunk_size")
    
    def chunk_text(
        self,
        text: str,
        source_id: str,
        source_type: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> List[ChunkResult]:
        """
        Split text into chunks with full metadata tracking.
        
        Args:
            text: The text content to chunk
            source_id: ID of the source document (note ID, file ID, etc.)
            source_type: Type of source ("note", "file", etc.)
            metadata: Additional metadata to include with each chunk
            
        Returns:
            List of ChunkResult objects with content and metadata
        """
        if not text or not text.strip():
            return []
        
        text = text.strip()
        metadata = metadata or {}
        
        # If text is small enough, return as single chunk
        if len(text) <= self.chunk_size:
            chunk_id = self._generate_chunk_id(source_id, 0)
            return [ChunkResult(
                content=text,
                chunk_index=0,
                total_chunks=1,
                char_start=0,
                char_end=len(text),
                source_id=source_id,
                source_type=source_type,
                chunk_id=chunk_id,
                is_chunk=False,  # Not actually chunked
                metadata={
                    "parent_id": source_id,
                    **metadata
                }
            )]
        
        # Split into semantic units (paragraphs first, then sentences)
        chunks = self._semantic_split(text, source_id, source_type, metadata)
        
        logger.info(
            f"Chunked {source_type}/{source_id}: "
            f"{len(text)} chars -> {len(chunks)} chunks "
            f"(avg {len(text) // len(chunks)} chars/chunk)"
        )
        
        return chunks
    
    def _semantic_split(
        self,
        text: str,
        source_id: str,
        source_type: str,
        metadata: Dict[str, Any],
    ) -> List[ChunkResult]:
        """Split text respecting semantic boundaries."""
        chunks = []
        
        # First, split by paragraphs (double newlines)
        paragraphs = re.split(r'\n\s*\n', text)
        
        current_chunk = ""
        current_start = 0
        char_pos = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                char_pos += 2  # Account for the split newlines
                continue
            
            para_with_spacing = para + "\n\n"
            
            # Check if adding this paragraph would exceed chunk size
            if len(current_chunk) + len(para_with_spacing) <= self.chunk_size:
                current_chunk += para_with_spacing
            else:
                # Current chunk is full, save it
                if len(current_chunk.strip()) >= self.min_chunk_size:
                    chunks.append(self._create_chunk_result(
                        content=current_chunk.strip(),
                        char_start=current_start,
                        char_end=char_pos,
                        chunk_index=len(chunks),
                        source_id=source_id,
                        source_type=source_type,
                        metadata=metadata,
                    ))
                
                # Start new chunk with overlap
                if self.chunk_overlap > 0 and current_chunk:
                    overlap_text = self._get_overlap_text(current_chunk)
                    current_chunk = overlap_text + para_with_spacing
                    current_start = char_pos - len(overlap_text)
                else:
                    current_chunk = para_with_spacing
                    current_start = char_pos
                
                # If paragraph itself is too large, split it further
                if len(para_with_spacing) > self.chunk_size:
                    sentence_chunks = self._split_large_paragraph(
                        para,
                        char_pos,
                        len(chunks),
                        source_id,
                        source_type,
                        metadata,
                    )
                    chunks.extend(sentence_chunks)
                    current_chunk = ""
                    current_start = char_pos + len(para_with_spacing)
            
            char_pos += len(para_with_spacing)
        
        # Don't forget the last chunk
        if len(current_chunk.strip()) >= self.min_chunk_size:
            chunks.append(self._create_chunk_result(
                content=current_chunk.strip(),
                char_start=current_start,
                char_end=char_pos,
                chunk_index=len(chunks),
                source_id=source_id,
                source_type=source_type,
                metadata=metadata,
            ))
        
        # Update total_chunks for all results
        total = len(chunks)
        for chunk in chunks:
            chunk.total_chunks = total
        
        return chunks
    
    def _split_large_paragraph(
        self,
        paragraph: str,
        base_char_pos: int,
        base_chunk_index: int,
        source_id: str,
        source_type: str,
        metadata: Dict[str, Any],
    ) -> List[ChunkResult]:
        """Split a paragraph that's too large by sentence boundaries."""
        chunks = []
        
        # Split by sentences
        sentence_pattern = r'(?<=[.!?])\s+'
        sentences = re.split(sentence_pattern, paragraph)
        
        current_chunk = ""
        current_start = base_char_pos
        char_pos = base_char_pos
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            sentence_with_space = sentence + " "
            
            if len(current_chunk) + len(sentence_with_space) <= self.chunk_size:
                current_chunk += sentence_with_space
            else:
                # Save current chunk
                if len(current_chunk.strip()) >= self.min_chunk_size:
                    chunks.append(self._create_chunk_result(
                        content=current_chunk.strip(),
                        char_start=current_start,
                        char_end=char_pos,
                        chunk_index=base_chunk_index + len(chunks),
                        source_id=source_id,
                        source_type=source_type,
                        metadata=metadata,
                    ))
                
                # Start new chunk
                current_chunk = sentence_with_space
                current_start = char_pos
            
            char_pos += len(sentence_with_space)
        
        # Last chunk
        if len(current_chunk.strip()) >= self.min_chunk_size:
            chunks.append(self._create_chunk_result(
                content=current_chunk.strip(),
                char_start=current_start,
                char_end=char_pos,
                chunk_index=base_chunk_index + len(chunks),
                source_id=source_id,
                source_type=source_type,
                metadata=metadata,
            ))
        
        return chunks
    
    def _get_overlap_text(self, text: str) -> str:
        """Get overlap text from the end of current chunk."""
        if len(text) <= self.chunk_overlap:
            return text
        
        overlap = text[-self.chunk_overlap:]
        
        # Try to start at a sentence boundary
        if self.respect_sentences:
            sentence_start = overlap.find('. ')
            if sentence_start > 0 and sentence_start < len(overlap) - 20:
                overlap = overlap[sentence_start + 2:]
        
        return overlap
    
    def _create_chunk_result(
        self,
        content: str,
        char_start: int,
        char_end: int,
        chunk_index: int,
        source_id: str,
        source_type: str,
        metadata: Dict[str, Any],
    ) -> ChunkResult:
        """Create a ChunkResult with all metadata."""
        chunk_id = self._generate_chunk_id(source_id, chunk_index)
        
        # Determine chunk source type
        chunk_source_type = f"{source_type}_chunk" if source_type not in ("note_chunk", "file_chunk") else source_type
        
        return ChunkResult(
            content=content,
            chunk_index=chunk_index,
            total_chunks=0,  # Will be updated later
            char_start=char_start,
            char_end=char_end,
            source_id=chunk_id,
            source_type=chunk_source_type,
            chunk_id=chunk_id,
            is_chunk=True,
            metadata={
                "parent_id": source_id,
                "chunk_index": chunk_index,
                "char_start": char_start,
                "char_end": char_end,
                **metadata
            }
        )
    
    def _generate_chunk_id(self, source_id: str, chunk_index: int) -> str:
        """Generate a unique UUID for a chunk.
        
        Uses UUID5 to generate deterministic UUIDs based on source_id and chunk_index.
        This ensures the same chunk always gets the same ID, and the ID is a valid UUID
        for Qdrant vector storage.
        """
        # Create deterministic UUID from source_id and chunk_index
        chunk_key = f"{source_id}__chunk_{chunk_index}"
        return str(uuid.uuid5(CHUNK_NAMESPACE, chunk_key))
    
    @staticmethod
    def estimate_chunks(text_length: int, chunk_size: int = 1000, overlap: int = 200) -> int:
        """Estimate number of chunks for a given text length."""
        if text_length <= chunk_size:
            return 1
        
        effective_chunk_size = chunk_size - overlap
        return max(1, (text_length - overlap) // effective_chunk_size + 1)


# Convenience function for quick usage
def chunk_text(
    text: str,
    source_id: str,
    source_type: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    metadata: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Convenience function to chunk text.
    
    Returns list of dictionaries (not ChunkResult objects) for easy JSON serialization.
    """
    chunker = TextChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = chunker.chunk_text(text, source_id, source_type, metadata)
    return [chunk.to_dict() for chunk in chunks]
