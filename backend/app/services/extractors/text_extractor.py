"""
Text file extractor for plain text and markdown files
"""
import logging
from pathlib import Path

from app.services.extractors import BaseExtractor, ExtractionResult

logger = logging.getLogger(__name__)


class TextExtractor(BaseExtractor):
    """Extractor for plain text and markdown files"""
    
    supported_extensions = ['txt', 'md', 'markdown', 'text', 'rst', 'log']
    
    def extract(self, file_path: str) -> ExtractionResult:
        """Extract text from a text file"""
        try:
            path = Path(file_path)
            if not path.exists():
                return ExtractionResult(
                    text="",
                    error=f"File not found: {file_path}"
                )
            
            # Try different encodings
            encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
            content = None
            
            for encoding in encodings:
                try:
                    content = path.read_text(encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            
            if content is None:
                return ExtractionResult(
                    text="",
                    error=f"Could not decode file with any supported encoding"
                )
            
            cleaned_text = self._clean_text(content)
            
            return ExtractionResult(
                text=cleaned_text,
                page_count=None,  # Text files don't have pages
                metadata={"encoding": encoding}
            )
            
        except Exception as e:
            logger.exception(f"Error extracting text from {file_path}")
            return ExtractionResult(
                text="",
                error=f"Failed to extract text: {str(e)}"
            )
    
    def extract_from_bytes(self, content: bytes, filename: str) -> ExtractionResult:
        """Extract text from bytes content"""
        try:
            # Try different encodings
            encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
            text = None
            used_encoding = None
            
            for encoding in encodings:
                try:
                    text = content.decode(encoding)
                    used_encoding = encoding
                    break
                except UnicodeDecodeError:
                    continue
            
            if text is None:
                return ExtractionResult(
                    text="",
                    error="Could not decode file with any supported encoding"
                )
            
            cleaned_text = self._clean_text(text)
            
            return ExtractionResult(
                text=cleaned_text,
                page_count=None,
                metadata={"encoding": used_encoding}
            )
            
        except Exception as e:
            logger.exception(f"Error extracting text from bytes: {filename}")
            return ExtractionResult(
                text="",
                error=f"Failed to extract text: {str(e)}"
            )
