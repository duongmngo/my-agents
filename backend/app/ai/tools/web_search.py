"""Web Search Tool using Tavily API

Provides web search capabilities to agents for retrieving real-time information from the internet.
"""
import os
import logging
from typing import List, Dict, Any, Optional
from tavily import TavilyClient

logger = logging.getLogger(__name__)


async def search_web(
    query: str,
    max_results: int = 5,
    search_depth: str = "basic",
    include_domains: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Search the web using Tavily API.
    
    Args:
        query: The search query string
        max_results: Maximum number of results to return (default: 5)
        search_depth: Search depth - "basic" or "advanced" (default: "basic")
        include_domains: List of domains to include in search
        exclude_domains: List of domains to exclude from search
        
    Returns:
        Dict containing:
            - success: bool
            - results: List of search results with title, url, content, score
            - query: The original query
            - error: Error message if failed
    """
    try:
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            logger.error("TAVILY_API_KEY not found in environment variables")
            return {
                "success": False,
                "error": "Tavily API key not configured",
                "results": [],
                "query": query
            }
        
        # Initialize Tavily client
        client = TavilyClient(api_key=api_key)
        
        # Perform search
        search_params = {
            "query": query,
            "max_results": max_results,
            "search_depth": search_depth,
        }
        
        if include_domains:
            search_params["include_domains"] = include_domains
        if exclude_domains:
            search_params["exclude_domains"] = exclude_domains
        
        response = client.search(**search_params)
        
        # Extract and format results
        results = []
        if response and "results" in response:
            for item in response["results"]:
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "content": item.get("content", ""),
                    "score": item.get("score", 0.0),
                })
        
        logger.info(f"Web search completed for query: '{query}', found {len(results)} results")
        
        return {
            "success": True,
            "results": results,
            "query": query,
            "answer": response.get("answer", "") if response else ""
        }
        
    except Exception as e:
        logger.error(f"Web search failed for query '{query}': {e}")
        return {
            "success": False,
            "error": str(e),
            "results": [],
            "query": query
        }
