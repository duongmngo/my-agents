# Service Implementation Conventions

## Overview

This document defines the conventions and best practices for implementing services in the My Agents application. Services are the business logic layer that orchestrates operations between repositories, external APIs, and other services.

## Naming Conventions

### Service Classes
- **Pattern**: `{Entity}Service`
- **Examples**: `NoteService`, `UserService`, `WorkspaceService`, `EmbeddingService`
- **File Location**: `backend/app/services/{entity}_service.py`

### Service Methods
- **Pattern**: `{action}_{entity}` or `{action}_{entity}_{context}`
- **Examples**: 
  - `create_note()`
  - `get_workspace_notes()`
  - `update_note()`
  - `delete_note()`
  - `generate_note_embedding()`

### Method Naming Guidelines
- Use **snake_case** for all method names
- Use **descriptive verbs**: `create`, `get`, `update`, `delete`, `generate`, `process`, `validate`
- Include **entity context** when method operates on specific entities
- Use **action_context** pattern for complex operations: `get_workspace_notes()`, `generate_note_embedding()`

## Service Architecture Rules

### 1. Single Repository Rule
**Each service should only interact with its own repository.**

```python
# ✅ CORRECT - Service only uses its own repository
class NoteService:
    def __init__(self, db: Session):
        self.db = db
        self.note_repo = NoteRepository(db)  # Only own repository
    
    def create_note(self, note_data: dict) -> dict:
        return self.note_repo.create_note(note_data)

# ❌ INCORRECT - Service crosses repository boundaries
class NoteService:
    def __init__(self, db: Session):
        self.db = db
        self.note_repo = NoteRepository(db)
        self.user_repo = UserRepository(db)  # ❌ Don't do this
        self.workspace_repo = WorkspaceRepository(db)  # ❌ Don't do this
```

### 2. Service-to-Service Communication
**Services can call other services, but not repositories directly.**

```python
# ✅ CORRECT - Service calls other services
class NoteService:
    def __init__(self, db: Session):
        self.db = db
        self.note_repo = NoteRepository(db)
        self.user_service = UserService(db)  # ✅ Can use other services
        self.workspace_service = WorkspaceService(db)  # ✅ Can use other services
    
    def create_note(self, note_data: dict, user_id: str) -> dict:
        # Validate user through service
        user = self.user_service.get_user(user_id)
        if not user:
            return {"success": False, "error": "User not found"}
        
        # Create note through repository
        return self.note_repo.create_note(note_data)

# ❌ INCORRECT - Service directly calls other repositories
class NoteService:
    def create_note(self, note_data: dict, user_id: str) -> dict:
        user_repo = UserRepository(self.db)  # ❌ Don't do this
        user = user_repo.get_user_by_id(user_id)
        # ...
```

### 3. Repository Access Pattern
**Services should only access their own repository through dependency injection.**

```python
# ✅ CORRECT - Repository injected in constructor
class NoteService:
    def __init__(self, db: Session):
        self.db = db
        self.note_repo = NoteRepository(db)
    
    def get_note(self, note_id: str) -> dict:
        return self.note_repo.get_note_by_id(note_id)

# ❌ INCORRECT - Repository created inside methods
class NoteService:
    def get_note(self, note_id: str) -> dict:
        note_repo = NoteRepository(self.db)  # ❌ Don't do this
        return note_repo.get_note_by_id(note_id)
```

## Method Implementation Guidelines

### 1. Return Value Convention
**All service methods should return a standardized dictionary format:**

```python
# ✅ CORRECT - Standardized return format
def create_note(self, note_data: dict) -> dict:
    try:
        note = self.note_repo.create_note(note_data)
        return {
            "success": True,
            "data": note,
            "message": "Note created successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to create note: {str(e)}"
        }

# ❌ INCORRECT - Inconsistent return format
def create_note(self, note_data: dict):
    note = self.note_repo.create_note(note_data)
    return note  # ❌ Don't return raw data
```

### 2. Error Handling
**Always wrap operations in try-catch blocks and return meaningful error messages:**

```python
def update_note(self, note_id: str, update_data: dict) -> dict:
    try:
        # Business logic here
        updated_note = self.note_repo.update_note(note_id, update_data)
        
        if not updated_note:
            return {"success": False, "error": "Note not found"}
        
        return {
            "success": True,
            "data": updated_note,
            "message": "Note updated successfully"
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to update note: {str(e)}"}
```

### 3. Validation
**Perform business logic validation before repository operations:**

```python
def create_note(self, note_data: dict, user_id: str) -> dict:
    try:
        # Validate required fields
        if not note_data.get("title"):
            return {"success": False, "error": "Title is required"}
        
        if not note_data.get("content"):
            return {"success": False, "error": "Content is required"}
        
        # Validate user access through service
        user_service = UserService(self.db)
        user = user_service.get_user(user_id)
        if not user["success"]:
            return {"success": False, "error": "User not found"}
        
        # Create note
        note = self.note_repo.create_note(note_data)
        return {
            "success": True,
            "data": note,
            "message": "Note created successfully"
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to create note: {str(e)}"}
```

## Service Dependencies

### 1. Database Session
**Always inject database session through constructor:**

```python
class NoteService:
    def __init__(self, db: Session):
        self.db = db
        self.note_repo = NoteRepository(db)
```

### 2. Other Services
**Inject other services as needed:**

```python
class NoteService:
    def __init__(self, db: Session):
        self.db = db
        self.note_repo = NoteRepository(db)
        self.user_service = UserService(db)
        self.workspace_service = WorkspaceService(db)
```

### 3. External Services
**For external services (AI, vector DB, etc.), use dedicated service classes:**

```python
class NoteService:
    def __init__(self, db: Session):
        self.db = db
        self.note_repo = NoteRepository(db)
        self.vector_db_service = VectorDatabaseService()  # External service
```

## File Structure

### Service File Organization
```
backend/app/services/
├── __init__.py
├── note_service.py          # NoteService
├── user_service.py          # UserService
├── workspace_service.py     # WorkspaceService
├── embedding_service.py     # EmbeddingService
└── file_service.py          # FileService
```

### Service Class Structure
```python
"""
{Entity} service for business logic operations
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.repositories.{entity}_repository import {Entity}Repository
from app.services.{other}_service import {Other}Service


class {Entity}Service:
    """Service for {entity} operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.{entity}_repo = {Entity}Repository(db)
        # Other services as needed
    
    def create_{entity}(self, {entity}_data: dict) -> dict:
        """Create a new {entity}"""
        # Implementation here
    
    def get_{entity}(self, {entity}_id: str) -> dict:
        """Get {entity} by ID"""
        # Implementation here
    
    def update_{entity}(self, {entity}_id: str, update_data: dict) -> dict:
        """Update {entity}"""
        # Implementation here
    
    def delete_{entity}(self, {entity}_id: str) -> dict:
        """Delete {entity}"""
        # Implementation here
```

## Testing Guidelines

### 1. Mock Dependencies
**Mock all external dependencies in service tests:**

```python
def test_create_note_success():
    # Mock repository
    mock_repo = Mock()
    mock_repo.create_note.return_value = {"id": "123", "title": "Test"}
    
    # Mock service
    service = NoteService(db=None)
    service.note_repo = mock_repo
    
    # Test
    result = service.create_note({"title": "Test"})
    assert result["success"] is True
```

### 2. Test Business Logic
**Focus on testing business logic, not repository operations:**

```python
def test_create_note_validation():
    service = NoteService(db=None)
    
    # Test validation
    result = service.create_note({})  # Empty data
    assert result["success"] is False
    assert "required" in result["error"].lower()
```

## Common Patterns

### 1. CRUD Operations
```python
def create_{entity}(self, {entity}_data: dict) -> dict:
    """Create a new {entity}"""
    try:
        # Validation
        if not {entity}_data.get("required_field"):
            return {"success": False, "error": "Required field is missing"}
        
        # Create
        {entity} = self.{entity}_repo.create_{entity}({entity}_data)
        
        return {
            "success": True,
            "data": {entity},
            "message": "{Entity} created successfully"
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to create {entity}: {str(e)}"}

def get_{entity}(self, {entity}_id: str) -> dict:
    """Get {entity} by ID"""
    try:
        {entity} = self.{entity}_repo.get_{entity}_by_id({entity}_id)
        
        if not {entity}:
            return {"success": False, "error": "{Entity} not found"}
        
        return {
            "success": True,
            "data": {entity}
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to get {entity}: {str(e)}"}

def update_{entity}(self, {entity}_id: str, update_data: dict) -> dict:
    """Update {entity}"""
    try:
        # Check if exists
        existing = self.{entity}_repo.get_{entity}_by_id({entity}_id)
        if not existing:
            return {"success": False, "error": "{Entity} not found"}
        
        # Update
        updated = self.{entity}_repo.update_{entity}({entity}_id, update_data)
        
        return {
            "success": True,
            "data": updated,
            "message": "{Entity} updated successfully"
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to update {entity}: {str(e)}"}

def delete_{entity}(self, {entity}_id: str) -> dict:
    """Delete {entity}"""
    try:
        # Check if exists
        existing = self.{entity}_repo.get_{entity}_by_id({entity}_id)
        if not existing:
            return {"success": False, "error": "{Entity} not found"}
        
        # Delete
        success = self.{entity}_repo.delete_{entity}({entity}_id)
        
        if success:
            return {
                "success": True,
                "message": "{Entity} deleted successfully"
            }
        else:
            return {"success": False, "error": "Failed to delete {entity}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to delete {entity}: {str(e)}"}
```

### 2. List Operations
```python
def get_{entity}_list(self, filters: dict = None, skip: int = 0, limit: int = 20) -> dict:
    """Get list of {entity}s with pagination"""
    try:
        {entity}s = self.{entity}_repo.get_{entity}_list(filters, skip, limit)
        total = self.{entity}_repo.get_{entity}_count(filters)
        
        return {
            "success": True,
            "data": {
                "items": {entity}s,
                "total": total,
                "skip": skip,
                "limit": limit
            }
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to get {entity} list: {str(e)}"}
```

## Summary

- **Follow naming conventions** from API DTO standardization
- **Single repository rule** - each service only uses its own repository
- **Service-to-service communication** is allowed, repository-to-repository is not
- **Standardized return format** with success/error handling
- **Proper validation** and business logic in services
- **Clean separation** between business logic and data access layers

This ensures maintainable, testable, and well-structured service implementations.
