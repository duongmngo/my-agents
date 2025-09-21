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