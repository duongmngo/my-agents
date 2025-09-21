# Backend Architecture & Codebase Setup Rules

## Project Structure
```
app/
├── main.py                 # FastAPI application entry point
├── core/                   # Core configuration and setup
│   ├── config.py          # Settings and environment variables
│   ├── database.py        # Database connection and session
│   ├── security.py        # Authentication and authorization
│   └── dependencies.py    # Shared dependencies
├── api/                   # API routes and endpoints
│   ├── v1/               # API version 1
│   │   ├── auth.py       # Authentication endpoints
│   │   ├── users.py      # User management endpoints
│   │   ├── agents.py     # Agent management endpoints
│   │   ├── chat.py       # Chat endpoints
│   │   ├── mcp.py        # MCP integration endpoints
│   │   └── admin.py      # Admin endpoints
│   └── dependencies.py   # API-specific dependencies
├── models/               # Database models
│   ├── user.py          # User model
│   ├── agent.py         # Agent model
│   ├── conversation.py  # Conversation model
│   ├── message.py       # Message model
│   └── mcp.py          # MCP models
├── schemas/             # Pydantic schemas
│   ├── user.py         # User schemas
│   ├── agent.py        # Agent schemas
│   ├── chat.py         # Chat schemas
│   └── mcp.py          # MCP schemas
├── services/            # Business logic
│   ├── user_service.py # User business logic
│   ├── agent_service.py # Agent business logic
│   ├── chat_service.py # Chat business logic
│   ├── mcp_service.py  # MCP integration service
│   └── file_service.py # File handling service
├── utils/              # Utility functions
│   ├── tenant.py       # Tenant utilities
│   ├── auth.py         # Authentication utilities
│   └── helpers.py      # General helpers
└── tests/              # Test files
    ├── api/            # API tests
    ├── services/       # Service tests
    └── utils/          # Utility tests
```

## Application Setup

### Main Application
```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, users, agents, chat, mcp, admin

app = FastAPI(
    title="Multi-Tenant Chat API",
    description="API for multi-tenant chat application with MCP integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(mcp.router, prefix="/api/v1/mcp", tags=["MCP"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
```

## Core Configuration

### Environment Configuration
```python
# core/config.py
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # MCP
    MCP_MANAGEMENT_URL: str
    
    # File Storage
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Database Setup
```python
# core/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Model Architecture

### Base Model
```python
# models/base.py
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class BaseModel(Base):
    __abstract__ = True
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### User Model Example
```python
# models/user.py
from sqlalchemy import Column, String, Boolean
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user")
```

## Schema Architecture

### Base Schema
```python
# schemas/base.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BaseSchema(BaseModel):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
```

### User Schema Example
```python
# schemas/user.py
from pydantic import BaseModel, EmailStr
from app.schemas.base import BaseSchema

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserResponse(BaseSchema):
    email: str
    username: str
    is_active: bool
    role: str
```

## Service Architecture

### Base Service
```python
# services/base_service.py
from typing import Generic, TypeVar, Type, List, Optional
from sqlalchemy.orm import Session
from app.models.base import BaseModel
from app.schemas.base import BaseSchema

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseSchema)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseSchema)

class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    def get_by_id(self, db: Session, id: str, tenant_id: str) -> Optional[ModelType]:
        return db.query(self.model).filter(
            self.model.id == id,
            self.model.tenant_id == tenant_id
        ).first()
    
    def get_all(self, db: Session, tenant_id: str) -> List[ModelType]:
        return db.query(self.model).filter(
            self.model.tenant_id == tenant_id
        ).all()
```

## API Architecture

### Route Structure
```python
# api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()
user_service = UserService()

@router.post("/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return user_service.create(db, user, current_user.tenant_id)
```

## Dependency Injection

### Shared Dependencies
```python
# core/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User

security = HTTPBearer()

async def get_current_user(
    token: str = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user = verify_token(token.credentials, db)
    if user is None:
        raise credentials_exception
    return user

async def get_current_tenant(current_user: User = Depends(get_current_user)):
    return current_user.tenant_id
```

## Multi-Tenant Architecture

### Tenant Middleware
```python
# core/tenant.py
from fastapi import Request
from typing import Optional

def get_tenant_from_request(request: Request) -> Optional[str]:
    # Extract tenant from subdomain, header, or path
    tenant = request.headers.get("X-Tenant-ID")
    if not tenant:
        # Fallback to subdomain
        host = request.headers.get("host", "")
        tenant = host.split(".")[0] if "." in host else None
    return tenant

def validate_tenant_access(user_tenant: str, request_tenant: str) -> bool:
    return user_tenant == request_tenant
```

## MCP Integration

### MCP Service
```python
# services/mcp_service.py
import httpx
from typing import Dict, Any
from app.core.config import settings

class MCPService:
    def __init__(self):
        self.base_url = settings.MCP_MANAGEMENT_URL
    
    async def execute_tool(
        self, 
        tool_name: str, 
        params: Dict[str, Any], 
        tenant_id: str
    ) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/tools/{tool_name}",
                json={"params": params, "tenant_id": tenant_id}
            )
            return response.json()
```

## Error Handling

### Custom Exceptions
```python
# core/exceptions.py
from fastapi import HTTPException, status

class TenantNotFoundException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

class AgentNotFoundException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
```

## Testing Structure

### Test Configuration
```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)
```

## Security Architecture

### Authentication
```python
# core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

## Database Migrations

### Alembic Setup
```python
# alembic/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from alembic import context
from app.core.config import settings
from app.models import *  # Import all models

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()
```

## Environment Setup

### Requirements
```txt
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose==3.3.0
passlib==1.7.4
python-multipart==0.0.6
httpx==0.25.2
redis==5.0.1
minio==7.2.0
pytest==7.4.3
pytest-asyncio==0.21.1
```

### Docker Setup
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Development Workflow

### Code Organization Rules
- Keep models simple and focused
- Use services for business logic
- Separate API routes by feature
- Use dependency injection for shared resources
- Implement proper error handling
- Write comprehensive tests
- Use type hints throughout
- Follow PEP 8 style guidelines 