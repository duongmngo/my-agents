"""Knowledge Base Tool

Retrieves relevant information from the vector database knowledge base for agent access.
"""
import logging
from typing import Dict, Any, List, Optional

from app.ai.embeddings import EmbeddingProviderFactory, EmbeddingRequest
from app.ai.embeddings.vector_db.vector_db_service import VectorDatabaseService

logger = logging.getLogger(__name__)

# Module-level cache for services
_embedding_providers: Dict[str, Any] = {}  # workspace_id -> provider
_vector_db_service = None


async def _get_embedding_provider_for_workspace(workspace_id: str):
    """Get embedding provider for a workspace using the workspace's configured provider.
    
    This ensures query embeddings match the stored note embeddings by using
    the same provider/model configuration.
    """
    global _embedding_providers
    
    if workspace_id in _embedding_providers:
        return _embedding_providers[workspace_id]
    
    # Use the workspace's configured embedding provider
    from app.services.embedding_service import EmbeddingProviderConfigService
    
    embedding_service = EmbeddingProviderConfigService()
    active_provider = embedding_service.get_active_provider(workspace_id)
    
    if not active_provider:
        raise ValueError(f"No active embedding provider configured for workspace {workspace_id}")
    
    # Use the workspace's configured provider (API key is in the config)
    logger.info(f"Using workspace embedding provider: {active_provider.provider_type.value}, model: {active_provider.get_config_value('model', 'unknown')}")
    provider = EmbeddingProviderFactory.create_provider(
        active_provider.provider_type.value,
        active_provider.config
    )
    
    _embedding_providers[workspace_id] = provider
    return provider


def clear_embedding_provider_cache(workspace_id: Optional[str] = None):
    """Clear cached embedding provider(s).
    
    Call this when workspace embedding configuration changes.
    
    Args:
        workspace_id: Specific workspace to clear, or None to clear all
    """
    global _embedding_providers
    if workspace_id:
        _embedding_providers.pop(workspace_id, None)
        logger.info(f"Cleared embedding provider cache for workspace {workspace_id}")
    else:
        _embedding_providers.clear()
        logger.info("Cleared all embedding provider caches")


async def _get_vector_db_service():
    """Get or create vector database service"""
    global _vector_db_service
    if _vector_db_service is None:
        _vector_db_service = VectorDatabaseService()
        await _vector_db_service.initialize()
    return _vector_db_service


async def search_knowledge_base(
    query: str,
    workspace_id: str,
    limit: int = 5,
    threshold: float = 0.0,
    source_type: Optional[str] = None,
    include_content: bool = True,
    max_content_length: int = 2000,
) -> Dict[str, Any]:
    """Search the knowledge base for relevant information.
    
    Args:
        query: The search query text
        workspace_id: Workspace ID to search within
        limit: Maximum number of results to return (default: 5)
        threshold: Minimum similarity score threshold 0.0-1.0 (default: 0.0)
        source_type: Filter by source type (e.g., "note", "file") (default: None = all)
        include_content: Whether to include full content in results (default: True)
        max_content_length: Maximum content length per result (default: 2000)
        
    Returns:
        Dict containing:
            - success: bool
            - query: The original query
            - results: List of matching documents with content and metadata
            - total_results: Number of results found
            - error: Error message if failed
    """
    try:
        if not query or not query.strip():
            return {
                "success": False,
                "query": query,
                "error": "Query cannot be empty"
            }
        
        if not workspace_id:
            return {
                "success": False,
                "query": query,
                "error": "workspace_id is required"
            }
        
        # Get services - use workspace's embedding provider for consistency
        embedding_provider = await _get_embedding_provider_for_workspace(workspace_id)
        vector_db_service = await _get_vector_db_service()
        
        # Generate embedding for the query
        embedding_response = await embedding_provider.generate_embedding(
            EmbeddingRequest(text=query.strip())
        )
        query_vector = embedding_response.embedding
        
        # Log query embedding details
        logger.info(
            f"Query embedding generated: "
            f"query='{query[:50]}...', "
            f"workspace_id={workspace_id}, "
            f"dimension={len(query_vector)}, "
            f"sample=[{query_vector[0]:.6f}, {query_vector[1]:.6f}, ..., {query_vector[-1]:.6f}]"
        )
        
        # Build filters
        filters = {}
        if source_type:
            filters["source_type"] = source_type
        
        # Search the vector database using VectorDatabaseService
        logger.info(f"Searching with workspace_id={workspace_id}, limit={limit}, threshold={threshold}")
        results = await vector_db_service.search_knowledge_base(
            query_vector=query_vector,
            workspace_id=workspace_id,
            limit=limit,
            threshold=threshold,
            filters=filters if filters else None,
        )
        logger.info(f"Search returned {len(results)} results")
        
        # Format results with enhanced source tracking
        formatted_results = []
        for result in results:
            content = result.content or ""
            
            # Truncate content if needed
            if len(content) > max_content_length:
                content = content[:max_content_length] + "...(truncated)"
            
            # Extract metadata
            metadata = result.metadata or {}
            
            # Debug log to trace metadata issues
            logger.debug(
                f"Result metadata for {result.source_type}/{result.source_id}: "
                f"note_title={metadata.get('note_title')}, "
                f"file_name={metadata.get('file_name')}, "
                f"folder_id={metadata.get('folder_id')}, "
                f"all_keys={list(metadata.keys())}"
            )
            
            # Determine source title based on source type
            source_title = None
            if result.source_type in ("note", "note_chunk"):
                source_title = metadata.get("note_title")
            elif result.source_type in ("file", "file_chunk", "knowledge_file", "knowledge_file_chunk"):
                source_title = metadata.get("file_name")
            
            # Build source citation info
            source_info = {
                "type": result.source_type,
                "id": result.source_id,
                "title": source_title or f"Untitled {result.source_type}",
                "folder_id": metadata.get("folder_id"),
                "created_at": metadata.get("created_at"),
                "updated_at": metadata.get("updated_at"),
            }
            
            # Add note-specific fields
            if result.source_type in ("note", "note_chunk"):
                source_info["note_title"] = metadata.get("note_title")
                source_info["note_format"] = metadata.get("note_format")
                source_info["word_count"] = metadata.get("word_count")
                source_info["character_count"] = metadata.get("character_count")
            
            # Add file-specific fields 
            if result.source_type in ("file", "file_chunk", "knowledge_file", "knowledge_file_chunk"):
                source_info["file_name"] = metadata.get("file_name")
                source_info["file_type"] = metadata.get("file_type")
                source_info["file_size"] = metadata.get("file_size")
            
            # Handle chunked content - link back to parent document
            if result.source_type in ("note_chunk", "file_chunk", "knowledge_file_chunk"):
                source_info["parent_id"] = metadata.get("parent_id")
                source_info["chunk_index"] = metadata.get("chunk_index")
                source_info["total_chunks"] = metadata.get("total_chunks")
                source_info["char_start"] = metadata.get("char_start")
                source_info["char_end"] = metadata.get("char_end")
            
            formatted_result = {
                "id": result.id,
                "score": round(result.score, 4),
                "source_type": result.source_type,
                "source_id": result.source_id,
                "source": source_info,
            }
            
            if include_content:
                formatted_result["content"] = content
            
            # Include useful metadata
            formatted_result["tags"] = metadata.get("tags", [])
            formatted_result["language"] = metadata.get("language")
            formatted_result["created_by"] = metadata.get("created_by")
            
            formatted_results.append(formatted_result)
        
        print(
            f"Knowledge base search: query='{query[:50]}...', "
            f"workspace={workspace_id}, results={len(formatted_results)}"
        )
        
        return {
            "success": True,
            "query": query,
            "results": formatted_results,
            "dataType": "knowledge_base_results",
            "total_results": len(formatted_results),
        }
        
    except Exception as e:
        logger.error(f"Error searching knowledge base: {e}")
        return {
            "success": False,
            "query": query,
            "error": str(e)
        }


async def get_document_by_id(
    document_id: str,
    workspace_id: str,
) -> Dict[str, Any]:
    """Retrieve a specific document from the knowledge base by its ID.
    
    Args:
        document_id: The document/vector ID to retrieve
        workspace_id: Workspace ID for verification
        
    Returns:
        Dict containing:
            - success: bool
            - document: The document content and metadata
            - error: Error message if failed
    """
    try:
        if not document_id:
            return {
                "success": False,
                "error": "document_id is required"
            }
        
        vector_db_service = await _get_vector_db_service()
        
        # Get the document
        result = await vector_db_service.get_note_embedding(document_id)
        
        if not result:
            return {
                "success": False,
                "document_id": document_id,
                "error": "Document not found"
            }
        
        payload = result.get("payload", {})
        
        # Verify workspace access
        doc_workspace = payload.get("workspace_id")
        if doc_workspace and doc_workspace != workspace_id:
            return {
                "success": False,
                "document_id": document_id,
                "error": "Document not found in this workspace"
            }
        
        document = {
            "id": document_id,
            "content": payload.get("content", ""),
            "source_type": payload.get("source_type"),
            "source_id": payload.get("source_id"),
            "tags": payload.get("tags", []),
            "language": payload.get("language"),
            "created_by": payload.get("created_by"),
            "metadata": payload.get("metadata", {}),
        }
        
        logger.info(f"Retrieved document {document_id} from workspace {workspace_id}")
        
        return {
            "success": True,
            "document": document,
        }
        
    except Exception as e:
        logger.error(f"Error retrieving document {document_id}: {e}")
        return {
            "success": False,
            "document_id": document_id,
            "error": str(e)
        }


# Tool definitions for agent registration
KNOWLEDGE_BASE_TOOLS = [
    {
        "name": "search_knowledge_base",
        "description": "Search the knowledge base for relevant information based on a query. Use this to find documents, notes, or files that might help answer the user's question.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to find relevant documents"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results (1-20)",
                    "default": 5
                },
                "source_type": {
                    "type": "string",
                    "description": "Filter by source type: 'note', 'file', or leave empty for all",
                    "enum": ["note", "file", None]
                },
            },
            "required": ["query"]
        },
        "function": search_knowledge_base,
    },
    {
        "name": "get_document",
        "description": "Retrieve a specific document from the knowledge base by its ID. Use this when you need the full content of a known document.",
        "parameters": {
            "type": "object",
            "properties": {
                "document_id": {
                    "type": "string",
                    "description": "The ID of the document to retrieve"
                },
            },
            "required": ["document_id"]
        },
        "function": get_document_by_id,
    },
]
