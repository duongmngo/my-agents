# Architecture Diagram

## System Overview

```mermaid
graph TB
    %% External Users
    User[👤 End Users]
    Admin[👨‍💼 Administrators]
    
    %% Frontend Layer
    subgraph "Frontend Layer"
        Web[🌐 Web Application<br/>Next.js + React]
        Mobile[📱 Mobile App<br/>React Native]
    end
    
    %% API Gateway Layer
    subgraph "API Gateway Layer"
        LB[⚖️ Load Balancer<br/>HAProxy]
        Gateway[🚪 API Gateway<br/>Kong/Nginx]
    end
    
    %% Backend Services Layer
    subgraph "Backend Services"
        Auth[🔐 Auth Service<br/>FastAPI]
        Agent[🤖 Agent Management<br/>FastAPI]
        Chat[💬 Chat Service<br/>FastAPI]
        Tenant[🏢 Tenant Management<br/>FastAPI]
        Knowledge[📚 Knowledge Base<br/>FastAPI]
        MCP[🔧 MCP Integration<br/>FastAPI]
        File[📁 File Storage<br/>FastAPI]
        Analytics[📊 Analytics<br/>FastAPI]
    end
    
    %% Data Layer
    subgraph "Data Layer"
        AppDB[(🗄️ PostgreSQL<br/>Application DB)]
    VectorDB[(🔍 Weaviate<br/>Vector DB)]
        Cache[(⚡ Redis Cache)]
        Storage[(📦 MinIO<br/>S3 Storage)]
        Search[(🔍 Elasticsearch)]
    end
    
    %% External Services
    subgraph "External Services"
        OpenAI[🤖 OpenAI API]
        MCPServers[🔧 MCP Servers]
        OAuth[🔑 OAuth Providers]
        Email[📧 Email Service]
    end
    
    %% Monitoring
    subgraph "Monitoring & Observability"
        Prometheus[📈 Prometheus]
        Grafana[📊 Grafana]
        ELK[📋 ELK Stack]
        Jaeger[🔍 Jaeger]
    end
    
    %% Connections
    User --> Web
    Admin --> Web
    User --> Mobile
    Admin --> Mobile
    
    Web --> LB
    Mobile --> LB
    LB --> Gateway
    
    Gateway --> Auth
    Gateway --> Agent
    Gateway --> Chat
    Gateway --> Tenant
    Gateway --> Knowledge
    Gateway --> MCP
    Gateway --> File
    Gateway --> Analytics
    
    Auth --> AppDB
Auth --> Cache
Agent --> AppDB
Agent --> Cache
Chat --> AppDB
Chat --> Cache
Tenant --> AppDB
Tenant --> Cache
Knowledge --> AppDB
Knowledge --> VectorDB
Knowledge --> Storage
MCP --> AppDB
MCP --> Cache
File --> Storage
File --> AppDB
Analytics --> AppDB
Analytics --> Cache
    
    Chat --> OpenAI
    Agent --> OpenAI
    MCP --> MCPServers
    Auth --> OAuth
    Auth --> Email
    
    Auth --> Prometheus
    Agent --> Prometheus
    Chat --> Prometheus
    Tenant --> Prometheus
    Knowledge --> Prometheus
    MCP --> Prometheus
    File --> Prometheus
    Analytics --> Prometheus
    
    Prometheus --> Grafana
    ELK --> Grafana
    Jaeger --> Grafana
```

## Multi-Tenant Architecture

```mermaid
graph TB
    %% Tenant Isolation
    subgraph "Tenant A"
        UserA[👤 User A1]
        UserA2[👤 User A2]
        AgentA[🤖 Agent A1]
        AgentA2[🤖 Agent A2]
        DataA[(📊 Data A)]
    end
    
    subgraph "Tenant B"
        UserB[👤 User B1]
        UserB2[👤 User B2]
        AgentB[🤖 Agent B1]
        DataB[(📊 Data B)]
    end
    
    subgraph "Shared Infrastructure"
        AuthService[🔐 Auth Service]
        ChatService[💬 Chat Service]
        Database[(🗄️ Shared Database<br/>tenant_id filtering)]
        Storage[(📦 Shared Storage<br/>tenant buckets)]
    end
    
    %% Tenant A connections
    UserA --> AuthService
    UserA2 --> AuthService
    AgentA --> ChatService
    AgentA2 --> ChatService
    AuthService --> Database
    ChatService --> Database
    Database --> DataA
    Storage --> DataA
    
    %% Tenant B connections
    UserB --> AuthService
    UserB2 --> AuthService
    AgentB --> ChatService
    AuthService --> Database
    ChatService --> Database
    Database --> DataB
    Storage --> DataB
    
    %% Data isolation
    DataA -.->|tenant_id = 'A'| Database
    DataB -.->|tenant_id = 'B'| Database
```

## MCP Integration Architecture

```mermaid
graph TB
    %% MCP Management Service
    subgraph "MCP Management Service"
        MCPService[🔧 MCP Service<br/>FastAPI]
        ServerMgmt[🖥️ Server Management]
        ToolDiscovery[🔍 Tool Discovery]
        ToolExecution[⚡ Tool Execution]
        Security[🔒 Security Layer]
    end
    
    %% MCP Servers
    subgraph "MCP Servers"
        FileServer[📁 File System<br/>MCP Server]
        DBServer[🗄️ Database<br/>MCP Server]
        WebServer[🌐 Web Tools<br/>MCP Server]
        CustomServer[⚙️ Custom Tools<br/>MCP Server]
    end
    
    %% Backend Services
    subgraph "Backend Services"
        AgentService[🤖 Agent Service]
        ChatService[💬 Chat Service]
    end
    
    %% External Tools
    subgraph "External Tools"
        FileTools[📁 File Operations]
        DBTools[🗄️ Database Queries]
        WebTools[🌐 Web Scraping]
        CustomTools[⚙️ Custom Functions]
    end
    
    %% Connections
    AgentService --> MCPService
    ChatService --> MCPService
    
    MCPService --> ServerMgmt
    MCPService --> ToolDiscovery
    MCPService --> ToolExecution
    MCPService --> Security
    
    ServerMgmt --> FileServer
    ServerMgmt --> DBServer
    ServerMgmt --> WebServer
    ServerMgmt --> CustomServer
    
    ToolDiscovery --> FileServer
    ToolDiscovery --> DBServer
    ToolDiscovery --> WebServer
    ToolDiscovery --> CustomServer
    
    ToolExecution --> FileServer
    ToolExecution --> DBServer
    ToolExecution --> WebServer
    ToolExecution --> CustomServer
    
    FileServer --> FileTools
    DBServer --> DBTools
    WebServer --> WebTools
    CustomServer --> CustomTools
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant G as API Gateway
    participant A as Auth Service
    participant C as Chat Service
    participant AG as Agent Service
    participant M as MCP Service
    participant DB as Database
    participant O as OpenAI
    participant MC as MCP Servers
    
    U->>F: Login
    F->>G: POST /auth/login
    G->>A: Authenticate
    A->>DB: Validate credentials
    DB-->>A: User data
    A-->>G: JWT token
    G-->>F: Token response
    F-->>U: Logged in
    
    U->>F: Start chat with agent
    F->>G: POST /agents/{id}/chat
    G->>AG: Get agent config
    AG->>DB: Fetch agent data
    DB-->>AG: Agent configuration
    AG-->>G: Agent config
    G->>C: Process message
    C->>M: Get available tools
    M->>MC: Discover tools
    MC-->>M: Tool list
    M-->>C: Available tools
    C->>O: Generate response
    O-->>C: AI response
    C->>DB: Save message
    DB-->>C: Confirmation
    C-->>G: Chat response
    G-->>F: Response data
    F-->>U: Display message
```

## Security Architecture

```mermaid
graph TB
    %% Security Layers
    subgraph "Network Security"
        WAF[🛡️ Web Application Firewall]
        LB[⚖️ Load Balancer<br/>SSL/TLS]
        VPN[🔐 VPN Access]
    end
    
    subgraph "Application Security"
        Auth[🔐 JWT Authentication]
        RBAC[👥 Role-Based Access Control]
        MFA[🔑 Multi-Factor Auth]
        Validation[✅ Input Validation]
    end
    
    subgraph "Data Security"
        Encryption[🔒 Encryption at Rest]
        TLS[🔐 TLS 1.3 in Transit]
        Isolation[🏢 Tenant Isolation]
        Audit[📋 Audit Logging]
    end
    
    subgraph "Infrastructure Security"
        Container[🐳 Container Security]
        Secrets[🗝️ Secrets Management]
        Network[🌐 Network Policies]
        Updates[🔄 Security Updates]
    end
    
    %% Data flow
    WAF --> LB
    LB --> Auth
    Auth --> RBAC
    RBAC --> MFA
    MFA --> Validation
    
    Validation --> Encryption
    Encryption --> TLS
    TLS --> Isolation
    Isolation --> Audit
    
    Audit --> Container
    Container --> Secrets
    Secrets --> Network
    Network --> Updates
```

## Deployment Architecture

```mermaid
graph TB
    %% Kubernetes Cluster
    subgraph "Kubernetes Cluster"
        subgraph "Ingress Layer"
            Ingress[🚪 Ingress Controller<br/>Nginx]
            Gateway[🚪 API Gateway<br/>Kong]
        end
        
        subgraph "Application Layer"
            Frontend[🌐 Frontend Pods<br/>Next.js]
            Backend[🔧 Backend Pods<br/>FastAPI]
            MCPService[🔧 MCP Service Pods]
        end
        
        subgraph "Data Layer"
            Database[(🗄️ PostgreSQL Pods)]
            Cache[(⚡ Redis Pods)]
            Storage[(📦 MinIO Pods)]
        end
        
        subgraph "Monitoring Layer"
            Prometheus[📈 Prometheus Pods]
            Grafana[📊 Grafana Pods]
            ELK[📋 ELK Stack Pods]
        end
    end
    
    %% Infrastructure
    subgraph "Infrastructure"
        Nodes[🖥️ Worker Nodes]
        Storage[💾 Persistent Storage]
        Network[🌐 Network Services]
    end
    
    %% External Services
    subgraph "External Services"
        OpenAI[🤖 OpenAI API]
        OAuth[🔑 OAuth Providers]
        Email[📧 Email Service]
    end
    
    %% Connections
    Ingress --> Gateway
    Gateway --> Frontend
    Gateway --> Backend
    Gateway --> MCPService
    
    Frontend --> Backend
    Backend --> MCPService
    Backend --> Database
    Backend --> Cache
    Backend --> Storage
    
    MCPService --> Database
    MCPService --> Cache
    
    Backend --> Prometheus
    MCPService --> Prometheus
    Prometheus --> Grafana
    ELK --> Grafana
    
    Backend --> OpenAI
    Backend --> OAuth
    Backend --> Email
    
    Frontend --> Nodes
    Backend --> Nodes
    MCPService --> Nodes
    Database --> Nodes
    Cache --> Nodes
    Storage --> Nodes
    Prometheus --> Nodes
    Grafana --> Nodes
    ELK --> Nodes
```

## Scalability Architecture

```mermaid
graph TB
    %% Auto Scaling
    subgraph "Auto Scaling"
        HPA[📈 Horizontal Pod Autoscaler]
        VPA[📊 Vertical Pod Autoscaler]
        Custom[🎯 Custom Metrics]
    end
    
    %% Load Balancing
    subgraph "Load Balancing"
        RoundRobin[🔄 Round Robin]
        LeastConn[⚡ Least Connections]
        Sticky[🎯 Sticky Sessions]
        Health[💚 Health Checks]
    end
    
    %% Caching Strategy
    subgraph "Caching"
        Redis[⚡ Redis Cluster]
        CDN[🌐 CDN]
        Browser[🌍 Browser Cache]
    end
    
    %% Database Scaling
    subgraph "Database Scaling"
        ReadReplicas[📖 Read Replicas]
        ConnectionPool[🔗 Connection Pooling]
        Sharding[🔀 Sharding]
    end
    
    %% Service Mesh
    subgraph "Service Mesh"
        Istio[🔧 Istio]
        CircuitBreaker[⚡ Circuit Breaker]
        Retry[🔄 Retry Logic]
        Timeout[⏱️ Timeout]
    end
    
    %% Connections
    HPA --> RoundRobin
    VPA --> LeastConn
    Custom --> Sticky
    Health --> Redis
    
    Redis --> CDN
    CDN --> Browser
    Browser --> ReadReplicas
    
    ReadReplicas --> ConnectionPool
    ConnectionPool --> Sharding
    Sharding --> Istio
    
    Istio --> CircuitBreaker
    CircuitBreaker --> Retry
    Retry --> Timeout
```

## Monitoring Architecture

```mermaid
graph TB
    %% Data Collection
    subgraph "Data Collection"
        Prometheus[📈 Prometheus<br/>Metrics]
        Fluentd[📋 Fluentd<br/>Logs]
        Jaeger[🔍 Jaeger<br/>Traces]
    end
    
    %% Processing
    subgraph "Processing"
        AlertManager[🚨 Alert Manager]
        Logstash[📝 Logstash]
        Elasticsearch[🔍 Elasticsearch]
    end
    
    %% Visualization
    subgraph "Visualization"
        Grafana[📊 Grafana<br/>Dashboards]
        Kibana[📋 Kibana<br/>Logs]
        JaegerUI[🔍 Jaeger UI<br/>Traces]
    end
    
    %% Alerting
    subgraph "Alerting"
        PagerDuty[📞 PagerDuty]
        Email[📧 Email]
        Slack[💬 Slack]
    end
    
    %% Health Monitoring
    subgraph "Health Monitoring"
        Liveness[💚 Liveness Probes]
        Readiness[✅ Readiness Probes]
        Startup[🚀 Startup Probes]
    end
    
    %% Connections
    Prometheus --> AlertManager
    Fluentd --> Logstash
    Logstash --> Elasticsearch
    Jaeger --> JaegerUI
    
    AlertManager --> PagerDuty
    AlertManager --> Email
    AlertManager --> Slack
    
    Elasticsearch --> Kibana
    AlertManager --> Grafana
    
    Liveness --> Prometheus
    Readiness --> Prometheus
    Startup --> Prometheus
``` 