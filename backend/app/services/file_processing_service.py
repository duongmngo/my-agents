"""
File processing service for handling knowledge file uploads and text extraction
"""
import hashlib
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from app.models.knowledge_file import FileStatus, KnowledgeFile
from app.repositories.knowledge_file_repository import KnowledgeFileRepository
from app.services.extractors.extractor_factory import ExtractorFactory
from app.utils.text_chunker import TextChunker

logger = logging.getLogger(__name__)


class FileProcessingService:
    """Service for processing uploaded files: extraction, chunking, and embedding"""
    
    # Chunking configuration
    CHUNK_SIZE = 1000  # characters per chunk
    CHUNK_OVERLAP = 200  # overlap between chunks
    CHUNK_THRESHOLD = 1500  # minimum content length to trigger chunking
    
    def __init__(self):
        self.knowledge_file_repo = KnowledgeFileRepository()
    
    def get_supported_extensions(self) -> list[str]:
        """Get list of supported file extensions"""
        return ExtractorFactory.get_supported_extensions()
    
    def is_supported_file(self, filename: str) -> bool:
        """Check if file type is supported"""
        if '.' not in filename:
            return False
        extension = filename.rsplit('.', 1)[-1]
        return ExtractorFactory.is_supported(extension)
    
    def calculate_file_hash(self, content: bytes) -> str:
        """Calculate SHA-256 hash of file content"""
        return hashlib.sha256(content).hexdigest()
    
    def generate_storage_path(
        self, 
        workspace_id: str, 
        original_filename: str
    ) -> tuple[str, str]:
        """Generate unique storage path and filename
        
        Returns:
            Tuple of (storage_path, unique_filename)
        """
        # Generate unique filename with timestamp and UUID
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        file_uuid = str(uuid.uuid4())[:8]
        extension = original_filename.rsplit('.', 1)[-1] if '.' in original_filename else ''
        base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
        
        # Clean base name (remove special characters)
        import re
        clean_base = re.sub(r'[^\w\-_]', '_', base_name)[:50]
        
        unique_filename = f"{clean_base}_{timestamp}_{file_uuid}.{extension}" if extension else f"{clean_base}_{timestamp}_{file_uuid}"
        storage_path = f"knowledge-files/{workspace_id}/{unique_filename}"
        
        return storage_path, unique_filename
    
    def extract_text(self, content: bytes, filename: str) -> Dict[str, Any]:
        """Extract text from file content
        
        Returns:
            Dict with success, text, page_count, metadata, or error
        """
        result = ExtractorFactory.extract_from_bytes(content, filename)
        
        if result.success:
            return {
                "success": True,
                "text": result.text,
                "page_count": result.page_count,
                "metadata": result.metadata,
                "character_count": result.character_count,
                "word_count": result.word_count
            }
        else:
            return {
                "success": False,
                "error": result.error
            }
    
    async def process_file(
        self,
        knowledge_file: KnowledgeFile,
        file_content: bytes
    ) -> Dict[str, Any]:
        """Process a knowledge file: extract text and generate embeddings
        
        Args:
            knowledge_file: The KnowledgeFile model instance
            file_content: Raw file bytes
            
        Returns:
            Dict with success status and processing results
        """
        try:
            # Update status to processing
            self.knowledge_file_repo.update_status(
                knowledge_file.id, 
                FileStatus.PROCESSING
            )
            
            # Extract text
            extraction_result = self.extract_text(
                file_content, 
                knowledge_file.original_filename
            )
            
            if not extraction_result["success"]:
                self.knowledge_file_repo.update_status(
                    knowledge_file.id,
                    FileStatus.FAILED,
                    error_message=extraction_result["error"]
                )
                return {
                    "success": False,
                    "error": f"Text extraction failed: {extraction_result['error']}"
                }
            
            extracted_text = extraction_result["text"]
            
            # Update file with extracted content
            self.knowledge_file_repo.update_extracted_content(
                knowledge_file.id,
                extracted_text,
                page_count=extraction_result.get("page_count")
            )
            
            # Generate embeddings
            embedding_result = await self._generate_embeddings(
                knowledge_file,
                extracted_text
            )
            
            if not embedding_result["success"]:
                # File is processed even if embedding fails
                self.knowledge_file_repo.update_status(
                    knowledge_file.id,
                    FileStatus.PROCESSED,
                    error_message=f"Embedding failed: {embedding_result['error']}"
                )
                return {
                    "success": True,
                    "warning": f"Text extracted but embedding failed: {embedding_result['error']}",
                    "text_extracted": True,
                    "embedded": False
                }
            
            # Update status to processed with embedding stats
            self.knowledge_file_repo.update_status(
                knowledge_file.id,
                FileStatus.PROCESSED
            )
            self.knowledge_file_repo.update_embedding_stats(
                knowledge_file.id,
                embedding_result["embedding_stats"]
            )
            
            return {
                "success": True,
                "text_extracted": True,
                "embedded": True,
                "embedding_stats": embedding_result["embedding_stats"]
            }
            
        except Exception as e:
            logger.exception(f"Error processing file {knowledge_file.id}")
            self.knowledge_file_repo.update_status(
                knowledge_file.id,
                FileStatus.FAILED,
                error_message=str(e)
            )
            return {
                "success": False,
                "error": f"Processing failed: {str(e)}"
            }
    
    async def _generate_embeddings(
        self,
        knowledge_file: KnowledgeFile,
        content: str
    ) -> Dict[str, Any]:
        """Generate and store embeddings for file content
        
        Uses chunking for large content, stores each chunk as separate embedding.
        """
        from app.services.embedding_service import EmbeddingProviderConfigService
        
        embedding_service = EmbeddingProviderConfigService()
        
        # Prepare file metadata
        file_metadata = {
            "file_name": knowledge_file.original_filename,
            "file_type": knowledge_file.file_type,
            "file_size": knowledge_file.file_size,
            "folder_id": knowledge_file.folder_id,
            "created_at": knowledge_file.created_at.isoformat() if knowledge_file.created_at else None,
        }
        
        # Check if we need to chunk the content
        if len(content) > self.CHUNK_THRESHOLD:
            return await self._store_chunked_embeddings(
                knowledge_file, 
                content, 
                file_metadata, 
                embedding_service
            )
        else:
            return await self._store_single_embedding(
                knowledge_file, 
                content, 
                file_metadata, 
                embedding_service
            )
    
    async def _store_single_embedding(
        self,
        knowledge_file: KnowledgeFile,
        content: str,
        metadata: dict,
        embedding_service
    ) -> Dict[str, Any]:
        """Store a single embedding for small files"""
        try:
            result = await embedding_service.generate_and_store_vector(
                content=content,
                workspace_id=knowledge_file.workspace_id,
                created_by=knowledge_file.created_by,
                source_type="knowledge_file",
                source_id=knowledge_file.id,
                metadata=metadata
            )
            
            if result["success"]:
                return {
                    "success": True,
                    "embedding_stats": {
                        "chunk_count": 1,
                        "model": result["data"].get("model"),
                        "tokens_processed": result["data"].get("tokens_processed", 0),
                        "latency_ms": result["data"].get("latency_ms", 0),
                        "indexed_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            else:
                return {
                    "success": False,
                    "error": result.get("error", "Unknown embedding error")
                }
                
        except Exception as e:
            logger.exception(f"Error storing single embedding for file {knowledge_file.id}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _store_chunked_embeddings(
        self,
        knowledge_file: KnowledgeFile,
        content: str,
        metadata: dict,
        embedding_service
    ) -> Dict[str, Any]:
        """Store multiple chunk embeddings for large files"""
        try:
            chunker = TextChunker(
                chunk_size=self.CHUNK_SIZE,
                chunk_overlap=self.CHUNK_OVERLAP,
                min_chunk_size=100
            )
            
            chunks = chunker.chunk_text(
                text=content,
                source_id=knowledge_file.id,
                source_type="knowledge_file",
                metadata=metadata
            )
            
            stored_chunks = []
            total_latency = 0
            total_tokens = 0
            model_used = None
            
            for chunk in chunks:
                chunk_metadata = {
                    **metadata,
                    "parent_id": knowledge_file.id,
                    "chunk_index": chunk.chunk_index,
                    "total_chunks": chunk.total_chunks,
                    "char_start": chunk.char_start,
                    "char_end": chunk.char_end,
                }
                
                result = await embedding_service.generate_and_store_vector(
                    content=chunk.content,
                    workspace_id=knowledge_file.workspace_id,
                    created_by=knowledge_file.created_by,
                    source_type="knowledge_file_chunk",
                    source_id=chunk.chunk_id,
                    metadata=chunk_metadata
                )
                
                if result["success"]:
                    stored_chunks.append({
                        "chunk_id": chunk.chunk_id,
                        "chunk_index": chunk.chunk_index,
                    })
                    total_latency += result["data"].get("latency_ms", 0)
                    total_tokens += result["data"].get("tokens_processed", 0)
                    if not model_used:
                        model_used = result["data"].get("model")
                else:
                    logger.warning(
                        f"Failed to store chunk {chunk.chunk_index} for file {knowledge_file.id}: "
                        f"{result.get('error')}"
                    )
            
            if not stored_chunks:
                return {
                    "success": False,
                    "error": "Failed to store any chunks"
                }
            
            return {
                "success": True,
                "embedding_stats": {
                    "chunk_count": len(stored_chunks),
                    "total_chunks_attempted": len(chunks),
                    "model": model_used,
                    "tokens_processed": total_tokens,
                    "latency_ms": total_latency,
                    "indexed_at": datetime.now(timezone.utc).isoformat()
                }
            }
            
        except Exception as e:
            logger.exception(f"Error storing chunked embeddings for file {knowledge_file.id}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def reprocess_file(
        self,
        file_id: str,
        file_content: bytes
    ) -> Dict[str, Any]:
        """Reprocess a file (e.g., after fixing extraction issues)
        
        This will clear old embeddings and regenerate them.
        """
        knowledge_file = self.knowledge_file_repo.get_file_by_id(file_id)
        if not knowledge_file:
            return {
                "success": False,
                "error": "File not found"
            }
        
        # Delete old embeddings from vector database
        await self._delete_file_embeddings(knowledge_file)
        
        # Reprocess
        return await self.process_file(knowledge_file, file_content)
    
    async def _delete_file_embeddings(self, knowledge_file: KnowledgeFile) -> None:
        """Delete all embeddings for a file from vector database"""
        from app.services.embedding_service import EmbeddingProviderConfigService
        
        try:
            embedding_service = EmbeddingProviderConfigService()
            
            # Delete main file embedding
            await embedding_service.delete_vector(
                workspace_id=knowledge_file.workspace_id,
                source_id=knowledge_file.id
            )
            
            # Delete chunk embeddings if file was chunked
            if knowledge_file.embedding_stats and knowledge_file.embedding_stats.get("chunk_count", 0) > 1:
                chunk_count = knowledge_file.embedding_stats.get("chunk_count", 0)
                for i in range(chunk_count):
                    # Generate chunk ID using same logic as TextChunker
                    import uuid as uuid_module
                    CHUNK_NAMESPACE = uuid_module.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
                    chunk_id = str(uuid_module.uuid5(CHUNK_NAMESPACE, f"{knowledge_file.id}__chunk_{i}"))
                    
                    await embedding_service.delete_vector(
                        workspace_id=knowledge_file.workspace_id,
                        source_id=chunk_id
                    )
                    
        except Exception as e:
            logger.warning(f"Error deleting embeddings for file {knowledge_file.id}: {e}")
