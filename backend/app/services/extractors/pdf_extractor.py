"""
PDF file extractor using pypdf
"""
import io
import logging
from pathlib import Path

from app.services.extractors import BaseExtractor, ExtractionResult

logger = logging.getLogger(__name__)


class PDFExtractor(BaseExtractor):
    """Extractor for PDF files using pypdf"""
    
    supported_extensions = ['pdf']
    
    def extract(self, file_path: str) -> ExtractionResult:
        """Extract text from a PDF file"""
        try:
            from pypdf import PdfReader
        except ImportError:
            return ExtractionResult(
                text="",
                error="pypdf library not installed. Run: pip install pypdf"
            )
        
        try:
            path = Path(file_path)
            if not path.exists():
                return ExtractionResult(
                    text="",
                    error=f"File not found: {file_path}"
                )
            
            reader = PdfReader(file_path)
            text_parts = []
            
            for page_num, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                except Exception as e:
                    logger.warning(f"Error extracting text from page {page_num}: {e}")
                    continue
            
            full_text = "\n\n".join(text_parts)
            cleaned_text = self._clean_text(full_text)
            
            # Extract metadata
            metadata = {}
            if reader.metadata:
                if reader.metadata.title:
                    metadata["title"] = reader.metadata.title
                if reader.metadata.author:
                    metadata["author"] = reader.metadata.author
                if reader.metadata.subject:
                    metadata["subject"] = reader.metadata.subject
            
            return ExtractionResult(
                text=cleaned_text,
                page_count=len(reader.pages),
                metadata=metadata if metadata else None
            )
            
        except Exception as e:
            logger.exception(f"Error extracting text from PDF: {file_path}")
            return ExtractionResult(
                text="",
                error=f"Failed to extract text from PDF: {str(e)}"
            )
    
    def extract_from_bytes(self, content: bytes, filename: str) -> ExtractionResult:
        """Extract text from PDF bytes content"""
        try:
            from pypdf import PdfReader
        except ImportError:
            return ExtractionResult(
                text="",
                error="pypdf library not installed. Run: pip install pypdf"
            )
        
        try:
            pdf_stream = io.BytesIO(content)
            reader = PdfReader(pdf_stream)
            text_parts = []
            
            for page_num, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                except Exception as e:
                    logger.warning(f"Error extracting text from page {page_num}: {e}")
                    continue
            
            full_text = "\n\n".join(text_parts)
            cleaned_text = self._clean_text(full_text)
            
            # Extract metadata
            metadata = {}
            if reader.metadata:
                if reader.metadata.title:
                    metadata["title"] = reader.metadata.title
                if reader.metadata.author:
                    metadata["author"] = reader.metadata.author
                if reader.metadata.subject:
                    metadata["subject"] = reader.metadata.subject
            
            return ExtractionResult(
                text=cleaned_text,
                page_count=len(reader.pages),
                metadata=metadata if metadata else None
            )
            
        except Exception as e:
            logger.exception(f"Error extracting text from PDF bytes: {filename}")
            return ExtractionResult(
                text="",
                error=f"Failed to extract text from PDF: {str(e)}"
            )
