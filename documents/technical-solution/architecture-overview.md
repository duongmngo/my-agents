# Architecture Overview

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Multi-Tenant Chat Application                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Frontend      │    │   API Gateway   │    │   Load Balancer │         │
│  │   (Next.js)     │◄──►│   (Kong/Nginx)  │◄──►│   (HAProxy)     │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Backend Services                                │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Auth      │  │   Agent     │  │   Chat      │  │   Tenant    │   │ │
│  │  │  Service    │  │ Management  │  │   Service   │  │ Management  │   │ │
│  │  │             │  │  Service    │  │             │  │  Service    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │ Knowledge   │  │   MCP       │  │   File      │  │  Analytics  │   │ │
│  │  │   Base      │  │ Integration │  │  Storage    │  │  Service    │   │ │
│  │  │  Service    │  │  Service    │  │  Service    │  │             │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Data Layer                                      │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │ PostgreSQL  │  │    Redis    │  │    MinIO    │  │  Elastic-    │   │ │
│  │  │ + pgvector  │  │   Cache     │  │ S3 Storage  │  │   search    │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        External Services                               │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   OpenAI    │  │   MCP       │  │   OAuth     │  │   Email     │   │ │
│  │  │    API      │  │  Servers    │  │  Providers  │  │  Service    │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Architecture

### 1. Frontend Service (Next.js)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Pages         │    │   Components    │    │   Hooks         │         │
│  │                 │    │                 │    │                 │         │
│  │ • Dashboard     │    │ • Chat Interface│    │ • useAuth       │         │
│  │ • Agent Mgmt    │    │ • Agent Cards   │    │ • useChat       │         │
│  │ • Settings      │    │ • File Upload   │    │ • useAgents     │         │
│  │ • Analytics     │    │ • Forms         │    │ • useTenant     │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Services      │    │   Utils         │    │   Types         │         │
│  │                 │    │                 │    │                 │         │
│  │ • API Client    │    │ • Date Utils    │    │ • Interfaces    │         │
│  │ • WebSocket     │    │ • Validation    │    │ • Enums         │         │
│  │ • File Upload   │    │ • Formatting    │    │ • Types         │         │
│  │ • Auth Service  │    │ • Helpers       │    │                 │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Backend Services (FastAPI)

#### Authentication Service
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Authentication Service                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Controllers   │    │   Services      │    │   Models        │         │
│  │                 │    │                 │    │                 │         │
│  │ • Auth Routes   │    │ • JWT Service   │    │ • User Model    │         │
│  │ • OAuth Routes  │    │ • OAuth Service │    │ • Session Model │         │
│  │ • User Routes   │    │ • Email Service │    │ • Tenant Model  │         │
│  │ • Admin Routes  │    │ • 2FA Service   │    │ • Role Model    │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Middleware    │    │   Utils         │    │   Schemas       │         │
│  │                 │    │                 │    │                 │         │
│  │ • Auth Middleware│   │ • Password Utils│   │ • User Schemas  │         │
│  │ • Tenant Middleware│ │ • JWT Utils     │   │ • Auth Schemas  │         │
│  │ • Rate Limiting │    │ • Validation    │   │ • OAuth Schemas │         │
│  │ • CORS          │    │ • Security      │   │ • Response Schemas│       │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Agent Management Service
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Agent Management Service                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Controllers   │    │   Services      │    │   Models        │         │
│  │                 │    │                 │    │                 │         │
│  │ • Agent Routes  │    │ • Agent Service │    │ • Agent Model   │         │
│  │ • Template Routes│   │ • MCP Service   │    │ • Template Model│         │
│  │ • Sharing Routes│    │ • Model Service │    │ • Config Model  │         │
│  │ • Analytics Routes│  │ • Analytics     │    │ • Version Model │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Middleware    │    │   Utils         │    │   Schemas       │         │
│  │                 │    │                 │    │                 │         │
│  │ • Auth Middleware│   │ • Config Utils  │   │ • Agent Schemas │         │
│  │ • Tenant Middleware│ │ • MCP Utils     │   │ • Template Schemas│       │
│  │ • Permission    │    │ • Validation    │   │ • Response Schemas│       │
│  │ • Rate Limiting │    │ • Security      │   │ • Error Schemas  │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Chat Service
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Chat Service                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Controllers   │    │   Services      │    │   Models        │         │
│  │                 │    │                 │    │                 │         │
│  │ • Chat Routes   │    │ • Chat Service  │    │ • Chat Model    │         │
│  │ • Message Routes│    │ • AI Service    │    │ • Message Model │         │
│  │ • File Routes   │    │ • WebSocket     │    │ • File Model    │         │
│  │ • Export Routes │    │ • Export Service│    │ • Session Model │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Middleware    │    │   Utils         │    │   Schemas       │         │
│  │                 │    │                 │    │                 │         │
│  │ • Auth Middleware│   │ • Message Utils │   │ • Chat Schemas  │         │
│  │ • Tenant Middleware│ │ • AI Utils      │   │ • Message Schemas│       │
│  │ • Rate Limiting │    │ • WebSocket     │   │ • File Schemas   │         │
│  │ • CORS          │    │ • Validation    │   │ • Response Schemas│       │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Data Layer Architecture

#### Database Design (Separated Architecture)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Database Architecture                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Core Tables   │    │   Agent Tables  │    │   Chat Tables   │         │
│  │                 │    │                 │    │                 │         │
│  │ • tenants       │    │ • agents        │    │ • conversations │         │
│  │ • users         │    │ • agent_configs │    │ • messages      │         │
│  │ • user_sessions │    │ • agent_templates│   │ • message_files │         │
│  │ • user_roles    │    │ • agent_shares  │    │ • chat_sessions │         │
│  │ • permissions   │    │ • agent_versions│    │ • chat_analytics│         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Knowledge Tables│    │   MCP Tables    │    │   File Tables   │         │
│  │                 │    │                 │    │                 │         │
│  │ • knowledge_bases│   │ • mcp_servers   │    │ • files         │         │
│  │ • knowledge_files│   │ • mcp_tools     │    │ • file_metadata │         │
│  │ • embeddings    │    │ • mcp_executions│    │ • file_permissions│       │
│  │ • vector_indexes│    │ • mcp_analytics │    │ • file_versions │         │
│  │ • search_logs   │    │ • mcp_configs   │    │ • file_analytics│         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Analytics Tables│    │   Audit Tables  │    │   Config Tables │         │
│  │                 │    │                 │    │                 │         │
│  │ • usage_metrics │    │ • audit_logs    │    │ • system_configs│         │
│  │ • performance   │    │ • access_logs   │    │ • tenant_configs│         │
│  │ • cost_tracking │    │ • security_logs │    │ • feature_flags │         │
│  │ • analytics     │    │ • change_logs   │    │ • integrations  │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. MCP Integration Architecture

#### MCP Server Management Service
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MCP Server Management Service                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Controllers   │    │   Services      │    │   Models        │         │
│  │                 │    │                 │    │                 │         │
│  │ • Server Routes │    │ • Server Mgmt   │    │ • Server Model  │         │
│  │ • Tool Routes   │    │ • Tool Discovery│    │ • Tool Model    │         │
│  │ • Config Routes │    │ • Tool Execution│    │ • Config Model  │         │
│  │ • Monitor Routes│    │ • Health Check  │    │ • Analytics Model│        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Middleware    │    │   Utils         │    │   Schemas       │         │
│  │                 │    │                 │    │                 │         │
│  │ • Auth Middleware│   │ • MCP Utils     │   │ • Server Schemas│         │
│  │ • Security      │    │ • Network Utils │   │ • Tool Schemas  │         │
│  │ • Rate Limiting │    │ • Validation    │   │ • Config Schemas│         │
│  │ • Monitoring    │    │ • Security      │   │ • Response Schemas│       │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        MCP Servers                                     │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   File      │  │   Database  │  │   Web       │  │   Custom    │   │ │
│  │  │   System    │  │   Tools     │  │   Tools     │  │   Tools     │   │ │
│  │  │   MCP       │  │   MCP       │  │   MCP       │  │   MCP       │   │ │
│  │  │   Server    │  │   Server    │  │   Server    │  │   Server    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Security Architecture

### Multi-Layer Security
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Security Layers                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Network Security                                    │ │
│  │  • Load Balancer with SSL/TLS termination                              │ │
│  │  • API Gateway with rate limiting and DDoS protection                  │ │
│  │  • Private network isolation for internal services                     │ │
│  │  • VPN access for administrative functions                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Application Security                                │ │
│  │  • JWT authentication with refresh tokens                              │ │
│  │  • Role-based access control (RBAC)                                    │ │
│  │  • Multi-factor authentication (MFA)                                   │ │
│  │  • Input validation and sanitization                                   │ │
│  │  • SQL injection prevention                                            │ │
│  │  • XSS protection                                                      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Data Security                                       │ │
│  │  • Encryption at rest (AES-256)                                        │ │
│  │  • Encryption in transit (TLS 1.3)                                     │ │
│  │  • Tenant data isolation                                               │ │
│  │  • Audit logging for all data access                                   │ │
│  │  • Data backup encryption                                              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Infrastructure Security                             │ │
│  │  • Container security scanning                                         │ │
│  │  • Secrets management (HashiCorp Vault)                                │ │
│  │  • Network policies and firewalls                                      │ │
│  │  • Regular security updates and patches                                │ │
│  │  • Intrusion detection and prevention                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

### Container Orchestration
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Deployment Architecture                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Ingress       │    │   Load Balancer │    │   API Gateway   │         │
│  │   Controller    │    │   (HAProxy)     │    │   (Kong)        │         │
│  │   (Nginx)       │    │                 │    │                 │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Kubernetes Cluster                              │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Frontend  │  │   Backend   │  │   MCP       │  │   Monitoring│   │ │
│  │  │   Pods      │  │   Pods      │  │   Service   │  │   Pods      │   │ │
│  │  │             │  │             │  │   Pods      │  │             │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Database  │  │   Cache     │  │   Storage   │  │   Search    │   │ │
│  │  │   Pods      │  │   Pods      │  │   Pods      │  │   Pods      │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Infrastructure                                  │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Compute   │  │   Storage   │  │   Network   │  │   Security  │   │ │
│  │  │   Nodes     │  │   Volumes   │  │   Services  │  │   Services  │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Scalability Architecture

### Horizontal Scaling Strategy
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Scalability Strategy                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Auto Scaling  │    │   Load Balancing│    │   Database      │         │
│  │                 │    │                 │    │   Scaling       │         │
│  │ • HPA (CPU/Mem) │    │ • Round Robin   │    │ • Read Replicas │         │
│  │ • VPA (Vertical)│    │ • Least Conn    │    │ • Connection    │         │
│  │ • Custom Metrics│    │ • Sticky Sessions│   │   Pooling       │         │
│  │ • Scale to Zero │    │ • Health Checks │    │ • Sharding      │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Caching       │    │   CDN           │    │   Microservices │         │
│  │   Strategy      │    │   Strategy      │    │   Scaling       │         │
│  │                 │    │                 │    │                 │         │
│  │ • Redis Cluster │    │ • Static Assets │    │ • Service Mesh  │         │
│  │ • Cache Layers  │    │ • API Caching   │    │ • Circuit       │         │
│  │ • Cache Warming │    │ • Edge Computing│    │   Breakers      │         │
│  │ • Cache Invalidation│ • Global Distribution│ • Retry Logic   │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Monitoring and Observability

### Monitoring Stack
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Monitoring & Observability                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Metrics       │    │   Logging       │    │   Tracing       │         │
│  │   Collection    │    │   System        │    │   System        │         │
│  │                 │    │                 │    │                 │         │
│  │ • Prometheus    │    │ • ELK Stack     │    │ • Jaeger        │         │
│  │ • Node Exporter │    │ • Fluentd       │    │ • OpenTelemetry │         │
│  │ • Custom Metrics│    │ • Log Aggregation│   │ • Distributed   │         │
│  │ • Alert Manager │    │ • Log Parsing   │    │   Tracing       │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Visualization │    │   Alerting      │    │   Health        │         │
│  │   & Dashboards  │    │   System        │    │   Monitoring    │         │
│  │                 │    │                 │    │                 │         │
│  │ • Grafana       │    │ • Alert Manager │    │ • Health Checks │         │
│  │ • Custom Dashboards│ │ • PagerDuty     │    │ • Liveness      │         │
│  │ • Real-time     │    │ • Email/SMS     │    │   Probes        │         │
│  │   Monitoring    │    │ • Slack/Teams   │    │ • Readiness     │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack Summary

### Frontend
- **Framework**: Next.js 14+ with TypeScript
- **UI Library**: React 18+ with Tailwind CSS
- **State Management**: Zustand/Redux Toolkit
- **Real-time**: WebSocket with Socket.io
- **Build Tool**: Vite/Turbopack

### Backend
- **Framework**: FastAPI with Python 3.11+
- **Application Database**: PostgreSQL 15+ for transactional data
- **Vector Database**: Weaviate for vector operations and semantic search
- **Cache**: Redis 7+ for sessions and caching
- **File Storage**: MinIO (S3-compatible)
- **Search**: PostgreSQL full-text search with pg_trgm
- **Message Queue**: Redis Bull for background tasks

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with Helm charts
- **API Gateway**: Kong/Nginx for routing and rate limiting
- **Load Balancer**: HAProxy for traffic distribution
- **Monitoring**: Prometheus + Grafana + ELK Stack
- **CI/CD**: GitHub Actions with automated testing and deployment

### Security
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Secrets**: HashiCorp Vault for secret management
- **Network**: Private networks with VPN access

### External Integrations
- **AI Models**: OpenAI API (GPT-4, GPT-3.5-turbo)
- **MCP Tools**: Custom MCP servers for tool integration
- **OAuth**: Google, GitHub, Microsoft authentication
- **Email**: SendGrid/AWS SES for notifications
- **Analytics**: Custom analytics with data export capabilities 