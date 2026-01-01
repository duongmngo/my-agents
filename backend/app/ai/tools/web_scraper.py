"""Web Scraper Tool

Fetches and extracts content from specific URLs for agent access to website information.
"""
import logging
from typing import Dict, Any, Optional
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


async def fetch_website(
    url: str,
    timeout: int = 10,
    max_content_length: int = 50000
) -> Dict[str, Any]:
    """Fetch and extract main content from a website URL.
    
    Args:
        url: The URL to fetch
        timeout: Request timeout in seconds (default: 10)
        max_content_length: Maximum content length to return in characters (default: 50000)
        
    Returns:
        Dict containing:
            - success: bool
            - url: The fetched URL
            - title: Page title
            - content: Extracted main text content
            - error: Error message if failed
    """
    try:
        # Validate URL
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return {
                "success": False,
                "url": url,
                "error": "Invalid URL format"
            }
        
        # Set headers to mimic browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        
        # Fetch the page
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract title
        title = soup.title.string.strip() if soup.title else ""
        
        # Remove script and style elements
        for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
            element.decompose()
        
        # Extract text from main content areas
        main_content = soup.find("main") or soup.find("article") or soup.find("div", class_="content") or soup.body
        
        if main_content:
            # Get text and clean it up
            text = main_content.get_text(separator="\n", strip=True)
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            content = "\n".join(lines)
        else:
            content = soup.get_text(separator="\n", strip=True)
        
        # Truncate if too long
        if len(content) > max_content_length:
            content = content[:max_content_length] + "\n...(content truncated)"
        
        logger.info(f"Successfully fetched website: {url}, content length: {len(content)}")
        
        return {
            "success": True,
            "url": url,
            "title": title,
            "content": content
        }
        
    except requests.exceptions.Timeout:
        logger.error(f"Timeout fetching URL: {url}")
        return {
            "success": False,
            "url": url,
            "error": f"Request timeout after {timeout} seconds"
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error fetching URL {url}: {e}")
        return {
            "success": False,
            "url": url,
            "error": f"Request failed: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Error fetching website {url}: {e}")
        return {
            "success": False,
            "url": url,
            "error": str(e)
        }
