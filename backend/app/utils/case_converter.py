"""
Utility functions for converting between snake_case and camelCase
"""
import re
from typing import Any, Dict, List, Union


def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase"""
    if not snake_str:
        return snake_str
    
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def to_snake_case(camel_str: str) -> str:
    """Convert camelCase to snake_case"""
    if not camel_str:
        return camel_str
    
    return re.sub(r'(?<!^)(?=[A-Z])', '_', camel_str).lower()


def convert_dict_keys(data: Any, converter_func) -> Any:
    """Recursively convert dictionary keys using the provided function"""
    if isinstance(data, dict):
        return {converter_func(k): convert_dict_keys(v, converter_func) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_dict_keys(item, converter_func) for item in data]
    else:
        return data


def to_camel_case_dict(data: Any) -> Any:
    """Convert all dictionary keys from snake_case to camelCase"""
    return convert_dict_keys(data, to_camel_case)


def to_snake_case_dict(data: Any) -> Any:
    """Convert all dictionary keys from camelCase to snake_case"""
    return convert_dict_keys(data, to_snake_case)


class CaseConverter:
    """Utility class for case conversion operations"""
    
    @staticmethod
    def camel_case(data: Any) -> Any:
        """Convert data to camelCase"""
        return to_camel_case_dict(data)
    
    @staticmethod
    def snake_case(data: Any) -> Any:
        """Convert data to snake_case"""
        return to_snake_case_dict(data)
    
    @staticmethod
    def convert_response(data: Any, format_type: str = "camelCase") -> Any:
        """Convert response data to specified format"""
        if format_type == "camelCase":
            return to_camel_case_dict(data)
        elif format_type == "snake_case":
            return to_snake_case_dict(data)
        else:
            return data


# Convenience functions
def camel_case(data: Any) -> Any:
    """Convert data to camelCase (convenience function)"""
    return to_camel_case_dict(data)


def snake_case(data: Any) -> Any:
    """Convert data to snake_case (convenience function)"""
    return to_snake_case_dict(data)
