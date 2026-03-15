"""
Base extractor class and common utilities for text extraction
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class ExtractionResult:
    """Result of text extraction"""
    text: str
    page_count: Optional[int] = None
    metadata: Optional[dict] = None
    error: Optional[str] = None
    
    @property
    def success(self) -> bool:
        return self.error is None and len(self.text) > 0
    
    @property
    def character_count(self) -> int:
        return len(self.text) if self.text else 0
    
    @property
    def word_count(self) -> int:
        return len(self.text.split()) if self.text else 0


class BaseExtractor(ABC):
    """Base class for text extractors"""
    
    # Supported file extensions for this extractor
    supported_extensions: list[str] = []
    
    @classmethod
    def can_handle(cls, file_extension: str) -> bool:
        """Check if this extractor can handle the given file extension"""
        ext = file_extension.lower().lstrip('.')
        return ext in cls.supported_extensions
    
    @abstractmethod
    def extract(self, file_path: str) -> ExtractionResult:
        """Extract text from file
        
        Args:
            file_path: Path to the file to extract text from
            
        Returns:
            ExtractionResult with extracted text or error
        """
        pass
    
    @abstractmethod
    def extract_from_bytes(self, content: bytes, filename: str) -> ExtractionResult:
        """Extract text from file bytes
        
        Args:
            content: File content as bytes
            filename: Original filename (for extension detection)
            
        Returns:
            ExtractionResult with extracted text or error
        """
        pass
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text by removing extra whitespace"""
        if not text:
            return ""
        # Replace multiple newlines with double newlines
        import re
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Replace multiple spaces with single space
        text = re.sub(r' +', ' ', text)
        # Strip leading/trailing whitespace from each line
        lines = [line.strip() for line in text.split('\n')]
        return '\n'.join(lines).strip()


# Export concrete extractors
from app.services.extractors.text_extractor import TextExtractor
from app.services.extractors.pdf_extractor import PDFExtractor
from app.services.extractors.docx_extractor import DocxExtractor
from app.services.extractors.extractor_factory import ExtractorFactory

__all__ = [
    'ExtractionResult',
    'BaseExtractor',
    'TextExtractor',
    'PDFExtractor',
    'DocxExtractor',
    'ExtractorFactory',
]
