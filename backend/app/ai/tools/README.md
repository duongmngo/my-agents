# AI Agent Tools

Reusable tools for enhancing agent capabilities with external data sources.

## Available Tools

### 1. Web Search (`search_web`)

Search the internet for real-time information using Tavily API.

**Location:** `app/ai/tools/web_search.py`

**Usage:**
```python
from app.ai.tools import search_web

result = await search_web(
    query="latest news about AI",
    max_results=5,
    search_depth="basic"  # or "advanced"
)

# Returns:
# {
#     "success": True,
#     "results": [
#         {
#             "title": "Article title",
#             "url": "https://...",
#             "content": "Snippet...",
#             "score": 0.95
#         }
#     ],
#     "query": "latest news about AI",
#     "answer": "Quick answer summary..."
# }
```

**Parameters:**
- `query` (str): Search query
- `max_results` (int, optional): Number of results (default: 5)
- `search_depth` (str, optional): "basic" or "advanced" (default: "basic")
- `include_domains` (List[str], optional): Limit to specific domains
- `exclude_domains` (List[str], optional): Exclude specific domains

**Environment Variables Required:**
- `TAVILY_API_KEY`: Your Tavily API key (get one at https://tavily.com)

### 2. Web Scraper (`fetch_website`)

Fetch and extract clean text content from specific URLs.

**Location:** `app/ai/tools/web_scraper.py`

**Usage:**
```python
from app.ai.tools import fetch_website

result = await fetch_website(
    url="https://example.com/article",
    timeout=10,
    max_content_length=50000
)

# Returns:
# {
#     "success": True,
#     "url": "https://example.com/article",
#     "title": "Page Title",
#     "content": "Extracted text content..."
# }
```

**Parameters:**
- `url` (str): Website URL to fetch
- `timeout` (int, optional): Request timeout in seconds (default: 10)
- `max_content_length` (int, optional): Max characters to return (default: 50000)

**Features:**
- Removes navigation, scripts, styles, and other non-content elements
- Extracts main content from `<main>`, `<article>`, or `.content` areas
- Cleans and formats text for readability
- Automatic content truncation

## Integration in Agents

These tools are integrated into the `default_agent.py` through a tool routing system:

1. **Plan Node**: Detects if tools are needed based on user query
2. **Route Tools Node**: Decides which path to take
3. **Execute Tools Node**: Runs search_web and/or fetch_website
4. **Generate Node**: Uses tool results in response generation

### Agent Plan Format

The agent's plan can trigger tools using special markers:

```
SEARCH: <query>     # Triggers web search
FETCH: <url>        # Triggers website fetch
```

### Event Emission

Tool execution emits WebSocket events for real-time UI updates:

- `TOOL_CALL`: Before tool execution (shows what's being called)
- `TOOL_RESULT`: After tool execution (shows results summary)

## Creating New Tools

To add a new tool:

1. Create a new file in `app/ai/tools/` (e.g., `my_tool.py`)
2. Implement an async function that returns a dict with `success`, `error`, and relevant data
3. Export the function in `__init__.py`
4. Update the agent's `_execute_tools_node` to detect and call your tool
5. Add necessary dependencies to `requirements.txt`
6. Document environment variables in `env-example`

**Example Tool Template:**
```python
"""My Custom Tool"""
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

async def my_custom_tool(param: str) -> Dict[str, Any]:
    """Description of what the tool does.
    
    Args:
        param: Parameter description
        
    Returns:
        Dict with success, data, and error fields
    """
    try:
        # Tool logic here
        result = do_something(param)
        
        return {
            "success": True,
            "data": result,
            "param": param
        }
    except Exception as e:
        logger.error(f"Tool error: {e}")
        return {
            "success": False,
            "error": str(e),
            "param": param
        }
```

## Dependencies

Install required packages:

```bash
pip install tavily-python beautifulsoup4 lxml requests
```

Or use the requirements.txt:

```bash
pip install -r requirements.txt
```

## Error Handling

All tools follow a consistent error handling pattern:

- Return `success: False` on errors
- Include `error` field with descriptive message
- Log errors for debugging
- Never raise exceptions (return error dict instead)

This ensures agents can gracefully handle tool failures without crashing.

## Testing Tools Independently

You can test tools directly:

```python
import asyncio
from app.ai.tools import search_web, fetch_website

async def test_tools():
    # Test search
    search_result = await search_web("Python programming")
    print(search_result)
    
    # Test fetch
    fetch_result = await fetch_website("https://python.org")
    print(fetch_result)

asyncio.run(test_tools())
```

## Rate Limiting & Best Practices

1. **Tavily API**: Free tier has rate limits - check your plan
2. **Website Fetching**: Respect robots.txt and rate limits
3. **Caching**: Consider caching results to avoid redundant calls
4. **Timeouts**: Always set reasonable timeouts (default: 10s)
5. **Content Length**: Limit scraped content to avoid token bloat

## Security Considerations

- Validate URLs before fetching (checked in `fetch_website`)
- Set timeouts to prevent hanging requests
- Don't expose API keys in responses
- Sanitize extracted content if displaying to users
- Consider implementing URL allowlist/blocklist for production
