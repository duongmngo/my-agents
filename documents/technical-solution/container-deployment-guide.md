# Container Deployment Guide - Multi-Tenant Architecture

## Overview

This document provides comprehensive deployment strategies for our multi-tenant ChatGPT-like application using container-based solutions. The guide covers Docker, Docker Compose, and Kubernetes deployment options for all components including the main application, MCP Server Management Service, PostgreSQL with pgvector, and MinIO.

## Deployment Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main App      │    │   MCP Server    │    │   PostgreSQL    │
│   (FastAPI)     │◄──►│   Management    │◄──►│   + pgvector    │
│   Container     │    │   Container     │    │   Container     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MinIO         │    │   Redis         │    │   Nginx         │
│   Container     │    │   Container     │    │   Container     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Docker Deployment

### **1. Main Application Container**

#### **Dockerfile for Main App**
```dockerfile
# Main Application Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### **Requirements.txt**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1
boto3==1.34.0
httpx==0.25.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0
```

### **2. MCP Server Management Service Container**

#### **Dockerfile for MCP Management Service**
```dockerfile
# MCP Server Management Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements-mcp.txt .
RUN pip install --no-cache-dir -r requirements-mcp.txt

# Copy application code
COPY mcp_management/ .

# Create non-root user
RUN useradd -m -u 1000 mcpuser && chown -R mcpuser:mcpuser /app
USER mcpuser

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Start service
CMD ["uvicorn", "mcp_management_service:app", "--host", "0.0.0.0", "--port", "8001"]
```

### **3. PostgreSQL with pgvector Container**

#### **Dockerfile for PostgreSQL**
```dockerfile
# PostgreSQL with pgvector Dockerfile
FROM postgres:15

# Install pgvector extension
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    postgresql-server-dev-15 \
    && git clone https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make \
    && make install \
    && cd .. \
    && rm -rf pgvector \
    && apt-get remove -y build-essential git postgresql-server-dev-15 \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Copy initialization scripts
COPY init-scripts/ /docker-entrypoint-initdb.d/

# Set environment variables
ENV POSTGRES_DB=chatgpt_app
ENV POSTGRES_USER=app_user
ENV POSTGRES_PASSWORD=secure_password

# Expose port
EXPOSE 5432

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pg_isready -U app_user -d chatgpt_app || exit 1
```

#### **Database Initialization Script**
```sql
-- init-scripts/01-init.sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tenant table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create embeddings table
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    source_type VARCHAR(50),
    source_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_embeddings_tenant_id ON embeddings(tenant_id);
CREATE INDEX idx_embeddings_tenant_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WHERE tenant_id IS NOT NULL;
```

### **4. MinIO Container**

#### **MinIO Docker Configuration**
```yaml
# MinIO service configuration
minio:
  image: minio/minio:latest
  container_name: minio
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin123
  volumes:
    - minio_data:/data
  command: server /data --console-address ":9001"
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 20s
    retries: 3
```

## Docker Compose Deployment

### **Complete Docker Compose Setup**

#### **docker-compose.yml**
```yaml
version: '3.8'

services:
  # Main Application
  main-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: chatgpt-main-app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://app_user:secure_password@postgres:5432/chatgpt_app
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
      - MCP_MANAGEMENT_URL=http://mcp-management:8001
      - JWT_SECRET_KEY=your-super-secret-jwt-key
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped

  # MCP Server Management Service
  mcp-management:
    build:
      context: .
      dockerfile: Dockerfile.mcp
    container_name: mcp-management-service
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://app_user:secure_password@postgres:5432/chatgpt_app
      - REDIS_URL=redis://redis:6379
      - MAX_SERVERS_PER_TENANT=5
      - SERVER_TIMEOUT=300
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped

  # PostgreSQL with pgvector
  postgres:
    build:
      context: .
      dockerfile: Dockerfile.postgres
    container_name: postgres-pgvector
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=chatgpt_app
      - POSTGRES_USER=app_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - app-network
    restart: unless-stopped

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MinIO for file storage
  minio:
    image: minio/minio:latest
    container_name: minio-storage
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - main-app
      - mcp-management
    networks:
      - app-network
    restart: unless-stopped

  # Monitoring stack (optional)
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - app-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  minio_data:
  prometheus_data:
  grafana_data:

networks:
  app-network:
    driver: bridge
```

### **Nginx Configuration**

#### **nginx/nginx.conf**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream main_app {
        server main-app:8000;
    }

    upstream mcp_management {
        server mcp-management:8001;
    }

    server {
        listen 80;
        server_name localhost;

        # Main application
        location / {
            proxy_pass http://main_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # MCP Management API
        location /mcp/ {
            proxy_pass http://mcp_management/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # MinIO Console
        location /minio/ {
            proxy_pass http://minio:9001/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Kubernetes Deployment

### **Kubernetes Manifests**

#### **1. Namespace**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: chatgpt-app
```

#### **2. ConfigMap**
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: chatgpt-app
data:
  DATABASE_URL: "postgresql://app_user:secure_password@postgres-service:5432/chatgpt_app"
  REDIS_URL: "redis://redis-service:6379"
  MINIO_ENDPOINT: "minio-service:9000"
  MCP_MANAGEMENT_URL: "http://mcp-management-service:8001"
```

#### **3. Secrets**
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: chatgpt-app
type: Opaque
data:
  JWT_SECRET_KEY: eW91ci1zdXBlci1zZWNyZXQtand0LWtleQ==  # base64 encoded
  MINIO_ACCESS_KEY: bWluaW9hZG1pbg==  # minioadmin
  MINIO_SECRET_KEY: bWluaW9hZG1pbjEyMw==  # minioadmin123
  POSTGRES_PASSWORD: c2VjdXJlX3Bhc3N3b3Jk  # secure_password
```

#### **4. PostgreSQL StatefulSet**
```yaml
# k8s/postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: chatgpt-app
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "chatgpt_app"
        - name: POSTGRES_USER
          value: "app_user"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: POSTGRES_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        - name: init-scripts
          mountPath: /docker-entrypoint-initdb.d
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: chatgpt-app
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None
```

#### **5. Main Application Deployment**
```yaml
# k8s/main-app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: main-app
  namespace: chatgpt-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: main-app
  template:
    metadata:
      labels:
        app: main-app
    spec:
      containers:
      - name: main-app
        image: chatgpt-app:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: main-app-service
  namespace: chatgpt-app
spec:
  selector:
    app: main-app
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
```

#### **6. Ingress**
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: chatgpt-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: main-app-service
            port:
              number: 80
```

## Deployment Scripts

### **Docker Compose Deployment Script**
```bash
#!/bin/bash
# deploy-docker-compose.sh

echo "Starting ChatGPT Multi-Tenant Application..."

# Build images
echo "Building Docker images..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 30

# Check service health
echo "Checking service health..."
docker-compose ps

# Initialize MinIO buckets
echo "Initializing MinIO buckets..."
docker-compose exec minio mc alias set myminio http://localhost:9000 minioadmin minioadmin123
docker-compose exec minio mc mb myminio/tenant-default
docker-compose exec minio mc mb myminio/shared

echo "Deployment completed successfully!"
echo "Access the application at: http://localhost"
echo "Access MinIO console at: http://localhost:9001"
```

### **Kubernetes Deployment Script**
```bash
#!/bin/bash
# deploy-kubernetes.sh

echo "Starting ChatGPT Multi-Tenant Application on Kubernetes..."

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply secrets and configmaps
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-statefulset.yaml

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n chatgpt-app --timeout=300s

# Deploy Redis
kubectl apply -f k8s/redis-deployment.yaml

# Deploy MinIO
kubectl apply -f k8s/minio-deployment.yaml

# Deploy MCP Management Service
kubectl apply -f k8s/mcp-management-deployment.yaml

# Deploy Main Application
kubectl apply -f k8s/main-app-deployment.yaml

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml

echo "Deployment completed successfully!"
echo "Check deployment status: kubectl get pods -n chatgpt-app"
```

## Environment-Specific Configurations

### **Development Environment**
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  main-app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
    environment:
      - ENVIRONMENT=development
      - DEBUG=true
    ports:
      - "8000:8000"
```

### **Production Environment**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  main-app:
    image: chatgpt-app:latest
    environment:
      - ENVIRONMENT=production
      - DEBUG=false
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

## Monitoring and Logging

### **Prometheus Configuration**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'main-app'
    static_configs:
      - targets: ['main-app:8000']

  - job_name: 'mcp-management'
    static_configs:
      - targets: ['mcp-management:8001']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
```

### **Grafana Dashboard**
```json
{
  "dashboard": {
    "title": "ChatGPT Multi-Tenant App",
    "panels": [
      {
        "title": "Application Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      }
    ]
  }
}
```

## Backup and Recovery

### **Database Backup Script**
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose exec postgres pg_dump -U app_user chatgpt_app > $BACKUP_DIR/postgres_backup_$DATE.sql

# Backup MinIO data
docker-compose exec minio mc mirror myminio $BACKUP_DIR/minio_backup_$DATE

echo "Backup completed: $BACKUP_DIR"
```

### **Restore Script**
```bash
#!/bin/bash
# restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Restore PostgreSQL
docker-compose exec -T postgres psql -U app_user chatgpt_app < $BACKUP_FILE

echo "Restore completed from: $BACKUP_FILE"
```

## Security Considerations

### **Network Security**
- Use internal networks for service communication
- Expose only necessary ports
- Implement proper firewall rules
- Use secrets management for sensitive data

### **Container Security**
- Run containers as non-root users
- Use minimal base images
- Regularly update base images
- Implement resource limits
- Use read-only file systems where possible

### **Data Security**
- Encrypt data at rest and in transit
- Implement proper access controls
- Use secure communication protocols
- Regular security audits

## Conclusion

This container deployment guide provides comprehensive strategies for deploying our multi-tenant ChatGPT-like application using Docker, Docker Compose, and Kubernetes. The solution ensures:

- ✅ **Scalability**: Easy horizontal and vertical scaling
- ✅ **Reliability**: High availability and fault tolerance
- ✅ **Security**: Proper isolation and access controls
- ✅ **Maintainability**: Easy deployment and updates
- ✅ **Monitoring**: Comprehensive observability
- ✅ **Backup**: Automated backup and recovery procedures

Choose the deployment strategy that best fits your infrastructure and operational requirements. 