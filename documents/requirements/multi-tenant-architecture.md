# Multi-Tenant Architecture

## Overview

This document outlines the multi-tenant architecture for the ChatGPT-like application, designed to support multiple organizations (tenants) on a single platform while maintaining complete data isolation and security. The system includes custom agents with separate knowledge bases for each agent.

## Architecture Principles

### 1. Tenant Isolation
- **Application-Level Filtering**: All data access filtered by tenant_id for complete isolation
- **Security by Design**: Zero possibility of data leakage between tenants through tenant_id filtering
- **Independent Scaling**: Each tenant can scale independently within shared infrastructure
- **Customization**: Per-tenant branding, features, and configuration

### 2. Resource Management
- **Resource Quotas**: Per-tenant limits on storage, API calls, and usage
- **Usage Tracking**: Detailed analytics per tenant
- **Billing Integration**: Usage-based billing per tenant
- **Performance Isolation**: One tenant's usage doesn't affect others through efficient filtering

### 3. Custom Agents Architecture
- **Agent Isolation**: Each agent has its own configuration and knowledge base
- **Knowledge Base Separation**: Complete isolation of knowledge bases between agents through tenant_id filtering
- **Multi-Conversation Support**: Each agent can have multiple conversations
- **Version Control**: Agent configurations and knowledge bases are versioned

## Database Architecture

### Shared Database, Shared Schema Approach
```
Database: chatapp_production
├── public (shared schema)
│   ├── tenants
│   ├── users (with tenant_id filter)
│   ├── agents (with tenant_id filter)
│   ├── knowledge_bases (with tenant_id filter)
│   ├── knowledge_files (with tenant_id filter)
│   ├── knowledge_embeddings (with tenant_id filter)
│   ├── conversations (with tenant_id filter)
│   ├── messages (with tenant_id filter)
│   ├── files (with tenant_id filter)
│   ├── analytics (with tenant_id filter)
│   ├── mcp_servers (with tenant_id filter)
│   ├── mcp_tools (with tenant_id filter)
│   ├── migrations
│   ├── system_config
│   └── agent_templates
```

### Key Benefits:
- **Simplified Management**: Single schema to maintain and backup
- **Efficient Queries**: Optimized indexes on tenant_id for fast filtering
- **Cost Effective**: Reduced database overhead and complexity
- **Scalable**: Support for 1000+ tenants with efficient filtering
- **Consistent**: All tenants use the same schema structure

### Custom Agents Database Structure
```sql
-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    avatar_url VARCHAR(500),
    model VARCHAR(50) DEFAULT 'gpt-4',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    capabilities JSONB,
    tools JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge bases table
CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_files INTEGER DEFAULT 0,
    total_size_mb DECIMAL(10,2) DEFAULT 0,
    last_processed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge files table
CREATE TABLE knowledge_files (
    id UUID PRIMARY KEY,
    knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size_mb DECIMAL(10,2),
    file_path VARCHAR(500),
    processed BOOLEAN DEFAULT FALSE,
    embeddings_count INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Knowledge embeddings table (using pgvector)
CREATE TABLE knowledge_embeddings (
    id UUID PRIMARY KEY,
    knowledge_file_id UUID REFERENCES knowledge_files(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL,
    content_chunk TEXT,
    embedding vector(1536), -- OpenAI embedding dimension
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tenant Identification
- **Subdomain Routing**: `tenant1.app.com`, `tenant2.app.com`
- **Path-based Routing**: `app.com/tenant1`, `app.com/tenant2`
- **Header-based**: Custom header for tenant identification
- **JWT Claims**: Tenant ID embedded in authentication tokens

### Database Security
- **Row-Level Security (RLS)**: Additional security layer
- **Connection Pooling**: Per-tenant connection pools
- **Query Isolation**: Automatic tenant context injection
- **Backup Isolation**: Per-tenant backup strategies

## File Storage Architecture

### MinIO Multi-Tenant Setup with Agents
```
MinIO Buckets:
├── tenant-001-bucket
│   ├── avatars/
│   ├── uploads/
│   ├── exports/
│   ├── temp/
│   └── agents/
│       ├── agent-001/
│       │   ├── knowledge/
│       │   │   ├── sales_manual.pdf
│       │   │   ├── product_catalog.xlsx
│       │   │   └── customer_data.json
│       │   └── config/
│       │       └── agent_config.json
│       └── agent-002/
│           ├── knowledge/
│           └── config/
├── tenant-002-bucket
│   ├── avatars/
│   ├── uploads/
│   ├── exports/
│   ├── temp/
│   └── agents/
└── shared-bucket (system files)
    ├── templates/
    ├── assets/
    ├── system/
    └── agent-templates/
        ├── sales-assistant/
        ├── customer-support/
        └── technical-writer/
```

### File Access Control
- **Bucket Policies**: Per-tenant access control
- **Pre-signed URLs**: Secure temporary file access
- **File Encryption**: At-rest encryption per tenant
- **Access Logging**: Complete audit trail
- **Agent File Isolation**: Each agent's files are completely isolated

## API Architecture

### Tenant-Aware API Design
```python
# FastAPI middleware for tenant identification
@app.middleware("http")
async def tenant_middleware(request: Request, call_next):
    tenant_id = extract_tenant_from_request(request)
    request.state.tenant_id = tenant_id
    response = await call_next(request)
    return response

# Database session with tenant context
def get_db_session(tenant_id: str):
    return SessionLocal(tenant_schema=f"tenant_{tenant_id}")

# Agent-aware chat endpoint
@app.post("/agents/{agent_id}/chat")
async def chat_with_agent(
    agent_id: str,
    message: ChatMessage,
    request: Request,
    db: Session = Depends(get_db_session)
):
    tenant_id = request.state.tenant_id
    
    # Verify agent belongs to tenant
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.tenant_id == tenant_id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Get agent's knowledge base
    knowledge_base = get_agent_knowledge_base(agent_id, tenant_id)
    
    # Process message with agent context and knowledge base
    response = await process_message_with_agent(message, agent, knowledge_base)
    
    return response
```

### API Endpoints Structure
```
/api/v1/
├── /auth/ (tenant-aware authentication)
├── /tenants/ (tenant management)
├── /agents/ (custom agents management)
│   ├── /{agentId}/ (agent-specific operations)
│   ├── /{agentId}/knowledge/ (knowledge base management)
│   ├── /{agentId}/conversations/ (agent conversations)
│   └── /templates/ (agent templates)
├── /conversations/ (general conversations)
├── /messages/ (general messages)
├── /files/ (general file management)
├── /analytics/ (analytics and insights)
└── /admin/ (super admin only)
```

## Custom Agents Architecture

### Agent Configuration Management
```json
{
  "agent_id": "uuid",
  "tenant_id": "tenant_001",
  "name": "Sales Assistant Agent",
  "description": "AI assistant specialized in sales and customer service",
  "instructions": "You are a sales assistant with expertise in...",
  "avatar": "https://...",
  "model": "gpt-4",
  "temperature": 0.7,
  "capabilities": {
    "web_browsing": true,
    "code_execution": false,
    "file_processing": true,
    "image_generation": false,
    "function_calling": true
  },
  "tools": [
    {
      "type": "function",
      "name": "get_customer_info",
      "description": "Get customer information from CRM",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": {
            "type": "string",
            "description": "Customer ID"
          }
        }
      }
    }
  ],
  "knowledge_base": {
    "id": "uuid",
    "files_count": 25,
    "total_size_mb": 150,
    "last_updated": "2024-01-01T00:00:00Z"
  }
}
```

### Knowledge Base Processing Pipeline
```
1. File Upload
   ↓
2. File Validation & Virus Scan
   ↓
3. Content Extraction (PDF, DOC, XLSX, etc.)
   ↓
4. Text Chunking (512-1024 tokens per chunk)
   ↓
5. Embedding Generation (OpenAI Embeddings API)
   ↓
6. Vector Storage (pgvector)
   ↓
7. Index Update
   ↓
8. Agent Knowledge Base Ready
```

### Agent Conversation Flow
```
User Message
    ↓
Agent Context Loading
    ↓
Knowledge Base Search (Vector Similarity)
    ↓
Context Assembly
    ↓
AI Model Processing
    ↓
Response Generation
    ↓
Response Storage
    ↓
User Response
```

## Tenant Management

### Tenant Lifecycle
1. **Provisioning**: Automated tenant creation
2. **Configuration**: Tenant-specific settings
3. **Monitoring**: Usage and performance tracking
4. **Scaling**: Resource allocation and limits
5. **Decommissioning**: Secure data removal

### Tenant Configuration
```json
{
  "tenant_id": "tenant_001",
  "name": "Acme Corporation",
  "domain": "acme.app.com",
  "plan": "enterprise",
  "limits": {
    "users": 1000,
    "storage_gb": 100,
    "api_calls_per_month": 100000,
    "ai_tokens_per_month": 1000000,
    "agents": 50,
    "knowledge_files": 1000,
    "knowledge_size_gb": 10
  },
  "features": {
    "file_upload": true,
    "team_collaboration": true,
    "advanced_analytics": true,
    "custom_branding": true,
    "custom_agents": true,
    "knowledge_bases": true,
    "agent_templates": true
  },
  "branding": {
    "logo_url": "https://...",
    "primary_color": "#3B82F6",
    "company_name": "Acme Corp"
  }
}
```

## Security Architecture

### Authentication & Authorization
- **Tenant-Specific JWT**: Tenant ID embedded in tokens
- **Role-Based Access**: Per-tenant user roles
- **API Key Management**: Tenant-specific API keys
- **Session Isolation**: Per-tenant session management
- **Agent Access Control**: Per-agent access permissions

### Data Protection
- **Encryption at Rest**: Per-tenant encryption keys
- **Encryption in Transit**: TLS 1.3 for all communications
- **Audit Logging**: Complete audit trail per tenant
- **Data Retention**: Per-tenant retention policies
- **Knowledge Base Security**: Secure access to agent knowledge bases

## Performance & Scalability

### Caching Strategy
- **Redis Namespaces**: Per-tenant cache isolation
- **CDN Configuration**: Tenant-specific content delivery
- **Database Indexing**: Optimized per-tenant queries
- **Connection Pooling**: Efficient resource management
- **Agent Response Caching**: Cache common agent responses

### Monitoring & Analytics
- **Per-Tenant Metrics**: Usage, performance, errors
- **Resource Monitoring**: CPU, memory, storage per tenant
- **Cost Tracking**: Per-tenant cost allocation
- **Alerting**: Tenant-specific alerts and notifications
- **Agent Analytics**: Per-agent usage and performance metrics

## Deployment Architecture

### Infrastructure Setup
```
Load Balancer (Nginx/HAProxy)
├── Tenant Router (FastAPI)
├── Application Servers (FastAPI)
├── Database Cluster (PostgreSQL + pgvector)
├── Cache Cluster (Redis)
├── File Storage (MinIO)
├── Search Cluster (Elasticsearch)
└── Vector Database (pgvector)
```

### Container Architecture
```yaml
# docker-compose.yml structure
services:
  app:
    environment:
      - TENANT_MODE=true
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
      - MINIO_ENDPOINT=minio:9000
      - OPENAI_API_KEY=...
  
  database:
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=chatapp_production
      - POSTGRES_EXTENSIONS=vector
  
  redis:
    volumes:
      - redis_data:/data
  
  minio:
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=admin
      - MINIO_ROOT_PASSWORD=password
  
  vector-processor:
    environment:
      - OPENAI_API_KEY=...
    volumes:
      - knowledge_files:/app/files
```

## Migration Strategy

### Database Migrations
- **Alembic**: Version-controlled schema migrations
- **Tenant-Specific Migrations**: Per-tenant schema updates
- **Rollback Strategy**: Safe rollback procedures
- **Data Migration**: Bulk data operations per tenant
- **Agent Migration**: Agent configuration and knowledge base migrations

### Zero-Downtime Deployment
- **Blue-Green Deployment**: Zero-downtime updates
- **Database Migrations**: Backward-compatible changes
- **Feature Flags**: Per-tenant feature toggles
- **Rollback Capability**: Quick rollback procedures

## Compliance & Governance

### Data Privacy
- **GDPR Compliance**: Per-tenant data protection
- **Data Portability**: Export capabilities per tenant
- **Right to Deletion**: Complete data removal
- **Audit Trails**: Comprehensive logging
- **Knowledge Base Privacy**: Secure knowledge base access

### Backup & Recovery
- **Per-Tenant Backups**: Isolated backup strategies
- **Disaster Recovery**: Tenant-specific recovery procedures
- **Data Retention**: Configurable retention policies
- **Recovery Testing**: Regular recovery drills
- **Agent Backup**: Agent configurations and knowledge base backups

## Cost Optimization

### Resource Allocation
- **Dynamic Scaling**: Automatic resource allocation
- **Usage-Based Billing**: Pay-per-use model
- **Resource Limits**: Prevent resource abuse
- **Cost Monitoring**: Real-time cost tracking
- **Agent Usage Tracking**: Per-agent usage monitoring

### Performance Optimization
- **Query Optimization**: Per-tenant query tuning
- **Caching Strategy**: Intelligent caching
- **CDN Usage**: Optimized content delivery
- **Database Indexing**: Strategic indexing per tenant
- **Vector Search Optimization**: Optimized embedding searches 