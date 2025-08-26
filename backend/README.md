# My Agents Backend

FastAPI-based backend for the multi-tenant chat application with workspace and file management.

## Features

- **Multi-tenant Architecture**: Isolated data per tenant with subdomain/header-based routing
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Workspace Management**: Create and manage collaborative workspaces
- **File Storage**: Upload and manage files with S3-compatible storage (MinIO)
- **Folder Organization**: Hierarchical folder structure for content organization
- **Note Management**: Create and manage markdown/rich text notes
- **Message System**: Real-time messaging and conversations
- **Repository Pattern**: Generic repository with specific implementations
- **Service Layer**: Business logic separation from API controllers

## Architecture

```
app/
├── main.py                 # FastAPI application entry point
├── core/                   # Core configuration and setup
│   ├── config.py          # Settings and environment variables
│   ├── database.py        # Database connection and session
│   ├── security.py        # Authentication and authorization
│   └── dependencies.py    # Shared dependencies
├── api/                   # API routes and endpoints
│   └── v1/               # API version 1
│       ├── auth.py       # Authentication endpoints
│       ├── users.py      # User management endpoints
│       ├── workspaces.py # Workspace management endpoints
│       ├── files.py      # File management endpoints
│       ├── folders.py    # Folder management endpoints
│       ├── notes.py      # Note management endpoints
│       ├── messages.py   # Message endpoints
│       └── admin.py      # Admin endpoints
├── models/               # Database models
│   ├── base.py          # Base model and mixins
│   ├── tenant.py        # Tenant model
│   ├── user.py          # User model
│   ├── workspace.py     # Workspace models
│   ├── folder.py        # Folder model
│   ├── file.py          # File model
│   ├── note.py          # Note model
│   └── message.py       # Message and conversation models
├── repositories/        # Repository layer
│   ├── base_repository.py      # Generic repository
│   ├── user_repository.py      # User-specific operations
│   ├── workspace_repository.py # Workspace operations
│   ├── folder_repository.py    # Folder operations
│   └── file_repository.py      # File operations
├── services/            # Business logic layer
│   ├── auth_service.py        # Authentication logic
│   ├── workspace_service.py   # Workspace logic
│   └── file_service.py        # File management logic
└── utils/              # Utility functions
```

## Tech Stack

- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Python SQL toolkit and ORM
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **MinIO**: S3-compatible file storage
- **Alembic**: Database migration tool
- **Pydantic**: Data validation and serialization
- **python-jose**: JWT token handling
- **bcrypt**: Password hashing

## Installation

### Prerequisites

- **Python 3.11+** (recommended: 3.11 or 3.12)
- **pyenv** (for Python version management)
- **PostgreSQL** (or use Docker setup)
- **Redis** (or use Docker setup)
- **MinIO** (or use Docker setup)

### Setup with pyenv (Recommended)

1. **Install pyenv** (if not already installed):
   ```bash
   # macOS
   brew install pyenv
   
   # Linux
   curl https://pyenv.run | bash
   
   # Windows (using pyenv-win)
   pip install pyenv-win
   ```

2. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd my-agents/backend
   ```

3. **Set up Python environment with pyenv:**
   ```bash
   # Install Python 3.11 (if not already installed)
   pyenv install 3.11.9
   
   # Set local Python version for this project
   pyenv local 3.11.9
   
   # Verify Python version
   python --version
   ```

4. **Create and activate virtual environment:**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

5. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

6. **Set up environment variables:**
   ```bash
   # Copy the environment example file
   cp ../documents/development/env-example .env
   
   # Remove frontend-specific variables from backend .env
   # Comment out or remove these lines from .env:
   # NEXT_PUBLIC_API_URL=http://localhost:8000
   # NEXT_PUBLIC_WS_URL=ws://localhost:8000
   
   # Edit .env with your settings
   ```

7. **Start infrastructure services** (if not using Docker):
   ```bash
   # Option 1: Use Docker for infrastructure only
   cd ../documents/development
   docker-compose -f docker-compose-infra.yml up -d
   
   # Option 2: Install and run services locally
   # PostgreSQL, Redis, MinIO
   ```

8. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

9. **Start the application:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Alternative: Quick Setup with pip

If you prefer not to use pyenv:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd my-agents/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Follow steps 6-9 from pyenv setup above.**

## Docker Development

Use the Docker Compose setup in `documents/development/`:

```bash
cd documents/development
docker-compose up -d
```

## pyenv Best Practices

### Managing Python Versions

```bash
# List installed Python versions
pyenv versions

# List available Python versions
pyenv install --list

# Set global Python version
pyenv global 3.11.9

# Set local Python version (creates .python-version file)
pyenv local 3.11.9

# Check current Python version
pyenv version
```

### Virtual Environment Management

```bash
# Create virtual environment with specific Python version
pyenv exec python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Deactivate virtual environment
deactivate
```

### Troubleshooting pyenv

**Common Issues:**

1. **pyenv not found**: Add to your shell profile:
   ```bash
   # Add to ~/.bashrc, ~/.zshrc, or ~/.profile
   export PYENV_ROOT="$HOME/.pyenv"
   export PATH="$PYENV_ROOT/bin:$PATH"
   eval "$(pyenv init --path)"
   eval "$(pyenv init -)"
   ```

2. **Python version not found**: Install the required version:
   ```bash
   pyenv install 3.11.9
   ```

3. **Permission issues**: On macOS/Linux, you might need:
   ```bash
   sudo chown -R $(whoami) ~/.pyenv
   ```

4. **Windows specific**: Use pyenv-win and ensure it's in your PATH.

## Troubleshooting

### Common Startup Issues

1. **Pydantic Validation Error**: If you see errors about extra fields like `NEXT_PUBLIC_API_URL`:
   ```bash
   # Remove or comment out frontend variables from backend .env
   # NEXT_PUBLIC_API_URL=http://localhost:8000
   # NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

2. **Database Connection Error**: Ensure PostgreSQL is running:
   ```bash
   # Check if Docker services are running
   docker ps
   
   # Start infrastructure services if needed
   cd ../documents/development
   docker-compose -f docker-compose-infra.yml up -d
   ```

3. **Import Errors**: Ensure you're in the correct directory and virtual environment is activated:
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. **Port Already in Use**: Change the port or stop the existing service:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
   ```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Environment Variables

Key environment variables (see `env-example` for full list):

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key
- `REDIS_URL`: Redis connection string
- `MINIO_ENDPOINT`: MinIO server endpoint
- `MINIO_ACCESS_KEY`: MinIO access key
- `MINIO_SECRET_KEY`: MinIO secret key

## API Authentication

The API uses JWT Bearer tokens:

1. **Register/Login** to get tokens:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"identifier": "user@example.com", "password": "password", "tenant_id": "tenant1"}'
   ```

2. **Use access token** in requests:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/workspaces/" \
        -H "Authorization: Bearer <access_token>"
   ```

## Multi-tenancy

The application supports multi-tenancy through:

1. **Tenant ID in headers**:
   ```bash
   curl -H "X-Tenant-ID: tenant1" http://localhost:8000/api/v1/workspaces/
   ```

2. **Subdomain routing** (when configured):
   ```
   tenant1.yourdomain.com/api/v1/workspaces/
   ```

## File Upload

Files are uploaded to MinIO storage:

```bash
curl -X POST "http://localhost:8000/api/v1/files/upload" \
     -H "Authorization: Bearer <token>" \
     -F "file=@document.pdf" \
     -F "workspace_id=workspace-id"
```

## Development Guidelines

- Follow the repository pattern for data access
- Use services for business logic
- Keep controllers thin
- Write tests for all business logic
- Use type hints throughout
- Follow PEP 8 style guidelines

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Multi-tenant data isolation
- Input validation with Pydantic
- CORS configuration
- Rate limiting (via nginx)

## Monitoring & Health

- Health check endpoint: `/health`
- Structured logging
- Error tracking
- Performance monitoring (TODO)

## Contributing

1. Create feature branch
2. Write tests
3. Follow code style
4. Update documentation
5. Submit pull request

## License

See LICENSE file for details.
