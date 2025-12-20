"""
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.middleware import CamelCaseMiddleware, SelectiveCamelCaseMiddleware
from app.api.v1 import auth, workspaces, folders, notes, embedding_provider_config, chat, websocket
from app.core.websocket import WebSocketManager, RedisAdapter
from app.core.dependencies import set_websocket_manager
from app.services.agent_event_emitter import get_agent_event_emitter

# Import other API routers as needed
# from app.api.v1 import users, files, etc.

# Disable SQLAlchemy logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)
logging.getLogger('sqlalchemy.engine.Engine').setLevel(logging.ERROR)
logging.getLogger('sqlalchemy.pool').setLevel(logging.ERROR)
logging.getLogger('sqlalchemy.dialects').setLevel(logging.ERROR)
logging.getLogger('sqlalchemy.orm').setLevel(logging.ERROR)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting up My Agents API...")
    
    # Initialize Redis adapter
    redis_adapter = RedisAdapter(settings.redis_url)
    await redis_adapter.connect()
    
    # Initialize WebSocket manager
    ws_manager = WebSocketManager(redis_adapter)
    await ws_manager.start()
    
    # Store manager in global state
    set_websocket_manager(ws_manager)
    
    # Initialize agent event emitter
    event_emitter = get_agent_event_emitter()
    await event_emitter.connect()
    
    logger.info("WebSocket system initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down My Agents API...")
    
    # Disconnect agent event emitter
    event_emitter = get_agent_event_emitter()
    await event_emitter.disconnect()
    
    # Stop WebSocket manager
    await ws_manager.stop()
    
    # Disconnect Redis
    await redis_adapter.disconnect()
    
    logger.info("WebSocket system shutdown complete")


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

# Include WebSocket router
app.include_router(websocket.router, prefix=f"{settings.api_v1_prefix}", tags=["websocket"])

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
