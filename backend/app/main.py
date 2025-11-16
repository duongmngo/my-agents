"""
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.middleware import CamelCaseMiddleware, SelectiveCamelCaseMiddleware
from app.api.v1 import auth, workspaces, folders, notes, embedding_provider_config, chat

# Import other API routers as needed
# from app.api.v1 import users, files, etc.


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("Starting up My Agents API...")
    yield
    # Shutdown
    print("Shutting down My Agents API...")


# Create FastAPI app
app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Option 1: Global camelCase middleware (converts all responses)
# app.add_middleware(CamelCaseMiddleware, convert_responses=True, convert_requests=False)

# Option 2: Selective camelCase middleware (only specific endpoints)
# app.add_middleware(
#     SelectiveCamelCaseMiddleware,
#     camel_case_endpoints={
#         "/api/v1/auth/login",
#         "/api/v1/auth/register",
#         "/api/v1/auth/me"
#     }
# )

# Option 3: No middleware (use Pydantic models with aliases)

# Include API routers
app.include_router(auth.router, prefix=f"{settings.api_v1_prefix}/auth", tags=["authentication"])

# Include workspace router
app.include_router(workspaces.router, prefix=f"{settings.api_v1_prefix}/workspaces", tags=["workspaces"])

# Include folders router
app.include_router(folders.router, prefix=f"{settings.api_v1_prefix}/folders", tags=["folders"])

# Include notes router
app.include_router(notes.router, prefix=f"{settings.api_v1_prefix}/notes", tags=["notes"])

# Include embedding provider config router
app.include_router(embedding_provider_config.router, prefix=f"{settings.api_v1_prefix}/embedding", tags=["embedding"])

# Include chat router
app.include_router(chat.router, prefix=f"{settings.api_v1_prefix}/chat", tags=["chat"])

# Include other routers as needed
# app.include_router(users.router, prefix=f"{settings.api_v1_prefix}/users", tags=["users"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to My Agents API",
        "version": settings.version,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "my-agents-api"}
