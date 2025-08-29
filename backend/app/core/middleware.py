"""
Custom middleware for request/response processing
"""
import json
import re
from typing import Any, Dict, Union
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase"""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def to_snake_case(camel_str: str) -> str:
    """Convert camelCase to snake_case"""
    return re.sub(r'(?<!^)(?=[A-Z])', '_', camel_str).lower()


def convert_dict_keys(data: Any, converter_func) -> Any:
    """Recursively convert dictionary keys using the provided function"""
    if isinstance(data, dict):
        return {converter_func(k): convert_dict_keys(v, converter_func) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_dict_keys(item, converter_func) for item in data]
    else:
        return data


class CamelCaseMiddleware(BaseHTTPMiddleware):
    """Middleware to convert request/response between camelCase and snake_case"""
    
    def __init__(self, app, convert_requests: bool = True, convert_responses: bool = True):
        super().__init__(app)
        self.convert_requests = convert_requests
        self.convert_responses = convert_responses
    
    async def dispatch(self, request: Request, call_next):
        # Convert request body from camelCase to snake_case
        if self.convert_requests and request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    json_data = json.loads(body)
                    converted_data = convert_dict_keys(json_data, to_snake_case)
                    # Create new request with converted body
                    request._body = json.dumps(converted_data).encode()
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass
        
        # Process the request
        response = await call_next(request)
        
        # Convert response body from snake_case to camelCase
        if self.convert_responses and isinstance(response, JSONResponse):
            try:
                response_data = response.body.decode()
                json_data = json.loads(response_data)
                converted_data = convert_dict_keys(json_data, to_camel_case)
                return JSONResponse(
                    content=converted_data,
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass
        
        return response


class SelectiveCamelCaseMiddleware(BaseHTTPMiddleware):
    """Middleware that only converts specific endpoints or based on headers"""
    
    def __init__(self, app, camel_case_endpoints: set = None, camel_case_header: str = "X-Response-Format"):
        super().__init__(app)
        self.camel_case_endpoints = camel_case_endpoints or set()
        self.camel_case_header = camel_case_header
    
    async def dispatch(self, request: Request, call_next):
        # Check if this endpoint should use camelCase
        should_convert = (
            request.url.path in self.camel_case_endpoints or
            request.headers.get(self.camel_case_header) == "camelCase"
        )
        
        response = await call_next(request)
        
        if should_convert and isinstance(response, JSONResponse):
            try:
                response_data = response.body.decode()
                json_data = json.loads(response_data)
                converted_data = convert_dict_keys(json_data, to_camel_case)
                return JSONResponse(
                    content=converted_data,
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass
        
        return response
