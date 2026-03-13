# API Conventions

This document defines the conventions and best practices for writing API endpoints in this project.

## Database Dependency Management

### Repository Access in API Controllers

**Rule: Never initialize repositories directly in API controllers. Always call services instead.**

### Service-to-Service Communication

**Rule: Services should never initialize other services' repositories. Services must communicate with each other through service interfaces only.**

#### ❌ Incorrect Pattern

```python
@router.get("/items")
async def get_items(current_user: User = Depends(get_current_user)):
    """❌ DO NOT DO THIS - Directly initializing repository in controller"""
    from app.repositories.item_repository import ItemRepository
    
    item_repo = ItemRepository()  # ❌ Repository initialization in API
    items = item_repo.get_all()
    return items
```

#### ✅ Correct Pattern

```python
@router.get("/items")
async def get_items(current_user: User = Depends(get_current_user)):
    """✅ CORRECT - Call service instead"""
    from app.services.item_service import ItemService
    
    item_service = ItemService()  # ✅ Service initialization in API
    items = item_service.get_all_items(user_id=current_user.id)
    return items
```

## Architecture Layers

The application follows a layered architecture:

```
API Controller → Service Layer → Repository Layer → Database
```

### Responsibilities

1. **API Controller Layer** (`app/api/v1/`)
   - Handle HTTP requests and responses
   - Authentication and authorization
   - Request validation (via Pydantic schemas)
   - Response formatting
   - **MUST NOT**: Directly access repositories or database

2. **Service Layer** (`app/services/`)
   - Business logic
   - Data transformation
   - Cross-cutting concerns (logging, caching, etc.)
   - Orchestration of multiple repositories
   - **MUST NOT**: Be initialized in controllers with database dependencies
   - **MUST NOT**: Initialize other services' repositories directly
   - **MUST**: Call other services when needing functionality from other domains

3. **Repository Layer** (`app/repositories/`)
   - Data access operations
   - Database query construction
   - Manages its own database sessions internally
   - **MUST NOT**: Be accessed directly from controllers

### Database Session Management

- **Repositories**: Manage their own database sessions internally using context managers
- **Services**: Do not require database session initialization - they create repositories that manage sessions
- **Controllers**: Do not handle database sessions at all

## Example: Complete Flow

### Repository Layer

```python
# app/repositories/item_repository.py
class ItemRepository(BaseRepository[Item]):
    def __init__(self):
        super().__init__(Item)  # Repository manages its own DB session
    
    def get_items_by_user(self, user_id: str) -> List[Item]:
        with self._get_db() as db:
            return db.query(Item).filter(Item.user_id == user_id).all()
```

### Service Layer

```python
# app/services/item_service.py
class ItemService:
    def __init__(self):
        self.item_repo = ItemRepository()  # Service creates repository
    
    def get_user_items(self, user_id: str) -> List[Item]:
        # Business logic here
        return self.item_repo.get_items_by_user(user_id)
```

### API Controller Layer

```python
# app/api/v1/items.py
@router.get("/items", response_model=List[ItemResponse])
async def get_items(
    current_user: User = Depends(get_current_user)
):
    """Get items for the current user"""
    item_service = ItemService()  # ✅ Controller creates service
    items = item_service.get_user_items(current_user.id)
    return items
```

## Benefits

Following this convention provides:

1. **Separation of Concerns**: Each layer has a clear, single responsibility
2. **Testability**: Services can be easily mocked in controller tests
3. **Reusability**: Services can be used by multiple controllers or background tasks
4. **Maintainability**: Changes to data access logic don't affect controllers
5. **Consistency**: Uniform pattern across all endpoints

## Common Mistakes to Avoid

### ❌ Direct Repository Access in Controllers

```python
# DON'T DO THIS
@router.post("/items")
async def create_item(
    item_data: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)  # ❌ Database dependency in controller
):
    item_repo = ItemRepository(db)  # ❌ Repository in controller
    item = item_repo.create(item_data)
    return item
```

### ❌ Passing Database Session to Services

```python
# DON'T DO THIS
chat_service = ChatService(db)  # ❌ Passing db to service
```

### ✅ Correct Pattern

```python
# DO THIS
chat_service = ChatService()  # ✅ Service manages its own dependencies
```

### ❌ Service Initializing Other Service's Repository

```python
# DON'T DO THIS - Service accessing another service's repository directly
class UserService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.workspace_repo = WorkspaceRepository()  # ❌ Don't initialize other service's repository
    
    def get_user_with_workspace(self, user_id: str):
        user = self.user_repo.get_by_id(user_id)
        workspace = self.workspace_repo.get_user_workspaces(user_id)  # ❌ Wrong approach
        return {"user": user, "workspace": workspace}
```

### ✅ Correct Pattern - Service Calling Other Service

```python
# DO THIS - Service calls another service
class UserService:
    def __init__(self):
        self.user_repo = UserRepository()  # ✅ Only own repository
        self.workspace_service = WorkspaceService()  # ✅ Call other service
    
    def get_user_with_workspace(self, user_id: str):
        user = self.user_repo.get_by_id(user_id)
        workspaces = self.workspace_service.get_user_workspaces(user_id)  # ✅ Use service interface
        return {"user": user, "workspace": workspaces[0] if workspaces else None}
```

## Enforcement

When reviewing code, ensure:

- [ ] No repository imports in API controller files
- [ ] No `db: Session = Depends(get_db)` in controller function signatures
- [ ] All data access goes through service layer
- [ ] Services are initialized without database dependencies
- [ ] Services do not initialize other services' repositories
- [ ] Services communicate with other services through service interfaces only

## Service Communication Principles

### Repository Ownership

Each service owns its repositories. For example:
- `UserService` owns `UserRepository`
- `WorkspaceService` owns `WorkspaceRepository`
- `ChatService` owns `ChatRepository` and `AgentRepository`

### Cross-Domain Operations

When a service needs data or functionality from another domain:

**❌ Wrong Approach:**
```python
class ChatService:
    def __init__(self):
        self.chat_repo = ChatRepository()
        self.user_repo = UserRepository()  # ❌ Don't initialize UserService's repository
        self.workspace_repo = WorkspaceRepository()  # ❌ Don't initialize WorkspaceService's repository
```

**✅ Correct Approach:**
```python
class ChatService:
    def __init__(self):
        self.chat_repo = ChatRepository()
        self.user_service = UserService()  # ✅ Use UserService
        self.workspace_service = WorkspaceService()  # ✅ Use WorkspaceService
    
    def create_conversation(self, user_id: str, workspace_id: str, data: dict):
        # Validate user exists through UserService
        user = self.user_service.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Validate workspace access through WorkspaceService
        workspace = self.workspace_service.get_workspace(workspace_id, user_id)
        if not workspace:
            raise ValueError("Workspace not found")
        
        # Create conversation using own repository
        conversation = self.chat_repo.create_conversation(...)
        return conversation
```

## Exceptions

There are no exceptions to this rule. If you find a case where you think a repository needs to be accessed directly from a controller or from another service, refactor it to go through the appropriate service instead.

