# Backend Coding Conventions

## File Naming
- Use snake_case for all file names: user_service.py, chat_handler.py, api_client.py, date_utils.py
- Service files: user_service.py, chat_service.py
- Handler files: auth_handler.py, file_handler.py
- Model files: user_model.py, agent_model.py
- Utility files: api_client.py, date_utils.py

## Project Structure
- Organize by feature, not by type
- Keep related files together
- Use clear directory names
- Separate business logic from API handlers

## Naming Conventions
- Classes: PascalCase (UserService, ChatHandler)
- Functions: snake_case (get_user_data, handle_request)
- Variables: snake_case (user_name, message_count)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL, MAX_FILE_SIZE)
- Database tables: snake_case (user_profiles, chat_messages)

## Code Organization
- Import order: standard library, third-party, local modules
- Group related functions in classes
- Use meaningful variable names
- Add docstrings for functions and classes

## FastAPI Structure
- Use dependency injection for database and services
- Separate routes by feature
- Use Pydantic models for request/response validation
- Keep route handlers thin - move logic to services

## Layered Architecture

### Layer Responsibilities
**API/Controller Layer** (`app/api/v1/`):
- Handle HTTP requests and responses only
- Use dependency injection for services and database sessions
- Call service layer methods only - never repositories or models directly
- Convert service responses to HTTP responses with appropriate status codes
- Keep handlers thin - no business logic

**Service Layer** (`app/services/`):
- Contain all business logic and validation
- Use only its own repository - never other repositories directly
- Can call other services for cross-domain operations (service-to-service communication)
- Return standardized dictionary format: `{"success": bool, "data": any, "error": str, "message": str}`
- Handle exceptions and return error responses
- No direct database session access

**Repository Layer** (`app/repositories/`):
- Only layer that directly interacts with database
- Handle all database operations (CRUD)
- Database session injected via constructor
- Return model objects directly
- No business logic

### Database Session Management
- Database session (`Session`) managed only in repository layer
- Inject session via dependency injection: `db: Session = Depends(get_db)`
- Pass session from API → Service → Repository
- Repository receives session in constructor: `def __init__(self, db: Session = None)`
- Never create `SessionLocal()` in API or Service layers

### Dependency Injection Pattern
```python
# ✅ CORRECT - API Layer
@router.get("/agents")
async def get_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    agent_service = AgentService(db)
    result = agent_service.get_agents_for_user(current_user.id)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    return result["data"]

# ✅ CORRECT - Service Layer
class AgentService:
    def __init__(self, db: Session):
        self.db = db
        self.agent_repo = AgentRepository(db)
        self.workspace_service = WorkspaceService(db)
    
    def get_agents_for_user(self, user_id: str):
        workspace_id = self.workspace_service.get_user_workspace_id(user_id)
        return self.agent_repo.get_agents_by_filters({"workspace_id": workspace_id})

# ✅ CORRECT - Repository Layer
class AgentRepository:
    def __init__(self, db: Session = None):
        self.db = db
    
    def get_agents_by_filters(self, filters: Dict[str, Any]) -> List[Agent]:
        query = self.db.query(Agent)
        # Apply filters...
        return query.all()

# ❌ INCORRECT - API calling repository directly
@router.get("/agents")
async def get_agents(db: Session = Depends(get_db)):
    agent_repo = AgentRepository(db)  # ❌ Don't do this
    return agent_repo.get_agents()

# ❌ INCORRECT - Service calling other repository
class AgentService:
    def __init__(self, db: Session):
        self.db = db
        self.agent_repo = AgentRepository(db)
        self.workspace_repo = WorkspaceRepository(db)  # ❌ Don't do this
    
    def get_agents(self):
        workspace = self.workspace_repo.get_by_id()  # ❌ Use WorkspaceService instead

# ❌ INCORRECT - Creating session in API/Service
def get_agents():
    db = SessionLocal()  # ❌ Don't do this
    # ...
    db.close()
```

### Service Return Format
All service methods must return standardized dictionary:
```python
# Success response
{
    "success": True,
    "data": <result_data>,
    "message": "Operation successful"  # Optional
}

# Error response
{
    "success": False,
    "error": "Error message describing what went wrong"
}
```

## Database
- Use SQLAlchemy ORM
- Define models with clear relationships
- Use migrations for schema changes
- Always filter by tenant_id for multi-tenant data
- Use indexes for frequently queried fields

## Error Handling
- Use custom exception classes
- Return consistent error responses
- Log errors with context
- Handle database errors gracefully
- Validate input data

## Security
- Always validate and sanitize input
- Use parameterized queries
- Implement proper authentication
- Check permissions for each operation
- Log security events

## Performance
- Use async/await for I/O operations
- Implement caching where appropriate
- Use database connection pooling
- Optimize database queries
- Use background tasks for heavy operations

## Testing
- Write unit tests for business logic
- Test API endpoints
- Mock external services
- Use test database for integration tests
- Test error scenarios

## Code Style
- Use 4 spaces for indentation
- Follow PEP 8 guidelines
- Use type hints
- Keep functions under 50 lines
- Use meaningful comments

## MCP Integration
- Keep MCP service separate from main API
- Use async operations for MCP calls
- Handle MCP server failures gracefully
- Log all MCP interactions
- Validate MCP tool responses

## API Response Format
- Use camelCase for all response properties
- Return consistent response structure
- Include proper HTTP status codes
- Add request ID for tracking
- Include tenant context in responses
- Use Pydantic models for response validation