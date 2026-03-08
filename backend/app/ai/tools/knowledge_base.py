"""Knowledge Base Tool

Retrieves relevant information from the vector database knowledge base for agent access.
"""
import logging
import os
from typing import Dict, Any, List, Optional

from app.ai.embeddings import EmbeddingProviderFactory, EmbeddingRequest
from app.ai.embeddings.vector_db.vector_db_service import VectorDatabaseService

logger = logging.getLogger(__name__)

# Module-level cache for services
_embedding_provider = None
_vector_db_service = None


async def _get_embedding_provider():
    """Get or create embedding provider"""
    global _embedding_provider
    if _embedding_provider is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        _embedding_provider = EmbeddingProviderFactory.create_provider(
            name="openai",
            config={
                "apiKey": api_key,
                "model": "text-embedding-3-small"
            }
        )
    return _embedding_provider


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
        
        # Get services
        embedding_provider = await _get_embedding_provider()
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
            f"dimension={len(query_vector)}, "
            f"sample=[{query_vector[0]:.6f}, {query_vector[1]:.6f}, ..., {query_vector[-1]:.6f}]"
        )
        
        # Build filters
        filters = {}
        if source_type:
            filters["source_type"] = source_type
        
        # Search the vector database using VectorDatabaseService
        logger.info(f"Searching with workspace_id={workspace_id}, limit={limit}, threshold={threshold}")
        results = await vector_db_service.search_similar_notes(
            query_vector=query_vector,
            workspace_id=workspace_id,
            limit=limit,
            threshold=threshold,
            filters=filters if filters else None,
        )
        logger.info(f"Search returned {len(results)} results")
        
        # Format results
        formatted_results = []
        for result in results:
            content = result.content or ""
            
            # Truncate content if needed
            if len(content) > max_content_length:
                content = content[:max_content_length] + "...(truncated)"
            
            formatted_result = {
                "id": result.id,
                "score": round(result.score, 4),
                "source_type": result.source_type,
                "source_id": result.source_id,
            }
            
            if include_content:
                formatted_result["content"] = content
            
            # Include useful metadata
            if result.metadata:
                formatted_result["tags"] = result.metadata.get("tags", [])
                formatted_result["language"] = result.metadata.get("language")
                formatted_result["created_by"] = result.metadata.get("created_by")
            
            formatted_results.append(formatted_result)
        
        print(
            f"Knowledge base search: query='{query[:50]}...', "
            f"workspace={workspace_id}, results={len(formatted_results)}"
        )
        
        return {
            "success": True,
            "query": query,
            "results": formatted_results,
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
