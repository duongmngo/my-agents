"""
Extractor factory for selecting appropriate extractor based on file type
"""
import logging
from typing import Optional, Type

from app.services.extractors import BaseExtractor, ExtractionResult
from app.services.extractors.text_extractor import TextExtractor
from app.services.extractors.pdf_extractor import PDFExtractor
from app.services.extractors.docx_extractor import DocxExtractor

logger = logging.getLogger(__name__)


class ExtractorFactory:
    """Factory for creating appropriate text extractors"""
    
    # Register all available extractors
    _extractors: list[Type[BaseExtractor]] = [
        TextExtractor,
        PDFExtractor,
        DocxExtractor,
    ]
    
    @classmethod
    def get_extractor(cls, file_extension: str) -> Optional[BaseExtractor]:
        """Get an extractor instance for the given file extension
        
        Args:
            file_extension: File extension (with or without dot)
            
        Returns:
            Extractor instance or None if no extractor supports the extension
        """
        ext = file_extension.lower().lstrip('.')
        
        for extractor_class in cls._extractors:
            if extractor_class.can_handle(ext):
                return extractor_class()
        
        return None
    
    @classmethod
    def extract(cls, file_path: str, file_extension: str) -> ExtractionResult:
        """Extract text from a file
        
        Args:
            file_path: Path to the file
            file_extension: File extension
            
        Returns:
            ExtractionResult with extracted text or error
        """
        extractor = cls.get_extractor(file_extension)
        
        if extractor is None:
            return ExtractionResult(
                text="",
                error=f"No extractor available for file type: {file_extension}"
            )
        
        return extractor.extract(file_path)
    
    @classmethod
    def extract_from_bytes(cls, content: bytes, filename: str) -> ExtractionResult:
        """Extract text from file bytes
        
        Args:
            content: File content as bytes
            filename: Original filename (used to determine file type)
            
        Returns:
            ExtractionResult with extracted text or error
        """
        # Get extension from filename
        if '.' not in filename:
            return ExtractionResult(
                text="",
                error="Cannot determine file type: no extension in filename"
            )
        
        extension = filename.rsplit('.', 1)[-1]
        extractor = cls.get_extractor(extension)
        
        if extractor is None:
            return ExtractionResult(
                text="",
                error=f"No extractor available for file type: {extension}"
            )
        
        return extractor.extract_from_bytes(content, filename)
    
    @classmethod
    def get_supported_extensions(cls) -> list[str]:
        """Get list of all supported file extensions"""
        extensions = []
        for extractor_class in cls._extractors:
            extensions.extend(extractor_class.supported_extensions)
        return extensions
    
    @classmethod
    def is_supported(cls, file_extension: str) -> bool:
        """Check if a file extension is supported"""
        ext = file_extension.lower().lstrip('.')
        return ext in cls.get_supported_extensions()
