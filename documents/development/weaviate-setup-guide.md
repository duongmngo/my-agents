# Weaviate Vector Database Setup Guide

This guide will help you set up Weaviate as a vector database for the My Agents application.

## Prerequisites

- Docker and Docker Compose installed
- Python 3.11+ installed
- Backend dependencies installed

## Quick Start

### 1. Start Infrastructure Services

Start all infrastructure services including Weaviate:

```bash
# Navigate to the development directory
cd documents/development

# Start all services (PostgreSQL, Redis, MinIO, Weaviate)
docker-compose -f docker-compose-infra.yml up -d

# Check if all services are running
docker-compose -f docker-compose-infra.yml ps
```

### 2. Verify Weaviate is Running

Check if Weaviate is accessible:

```bash
# Check Weaviate health
curl http://localhost:8080/v1/.well-known/ready

# Check Weaviate info
curl http://localhost:8080/v1/meta
```

You should see responses indicating Weaviate is ready and running.

### 3. Setup Weaviate Schema

Run the setup script to create the necessary schemas:

```bash
# Navigate to backend directory
cd ../../backend

# Run the Weaviate setup script
python scripts/setup_weaviate.py

# Or test connection only
python scripts/setup_weaviate.py test
```

## Configuration

### Environment Variables

You can configure Weaviate using environment variables:

```bash
# Weaviate connection
export WEAVIATE_URL="http://localhost:8080"
export WEAVIATE_API_KEY=""  # Leave empty for local development

# Weaviate settings
export WEAVIATE_DEFAULT_CLASS="Document"
export WEAVIATE_BATCH_SIZE="100"
export WEAVIATE_DEFAULT_LIMIT="25"
export WEAVIATE_DISTANCE_METRIC="cosine"
```

### Docker Compose Configuration

The Weaviate service is configured in `docker-compose-infra.yml`:

```yaml
weaviate:
  image: semitechnologies/weaviate:1.21.0
  container_name: my-agents-weaviate
  environment:
    QUERY_DEFAULTS_LIMIT: 25
    AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
    PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
    DEFAULT_VECTORIZER_MODULE: 'none'
    ENABLE_MODULES: 'text2vec-openai,text2vec-cohere,text2vec-huggingface,generative-openai,generative-cohere'
    CLUSTER_HOSTNAME: 'node1'
  ports:
    - "8080:8080"
    - "50051:50051"
  volumes:
    - weaviate_data:/var/lib/weaviate
  networks:
    - my-agents-network
```

## Weaviate Features

### Supported Modules

The Weaviate instance includes these modules:

- **text2vec-openai**: OpenAI text embeddings
- **text2vec-cohere**: Cohere text embeddings  
- **text2vec-huggingface**: HuggingFace text embeddings
- **generative-openai**: OpenAI text generation
- **generative-cohere**: Cohere text generation

### Vector Distance Metrics

Supported distance metrics:

- `cosine` (default) - Cosine similarity
- `dot` - Dot product
- `l2-squared` - L2 squared distance
- `hamming` - Hamming distance
- `manhattan` - Manhattan distance

## API Endpoints

### Weaviate REST API

- **Base URL**: `http://localhost:8080/v1`
- **Health Check**: `GET /v1/.well-known/ready`
- **Schema**: `GET /v1/schema`
- **Objects**: `GET /v1/objects`
- **GraphQL**: `POST /v1/graphql`

### Application Integration

The application uses Weaviate through:

- `WeaviateClient` - Low-level client wrapper
- `WeaviateVectorDatabase` - High-level vector database interface
- `VectorDatabaseService` - Service layer for vector operations

## Usage Examples

### 1. Store a Document

```python
from app.ai.embeddings.vector_db.vector_db_service import VectorDatabaseService

# Initialize service
vector_service = VectorDatabaseService()

# Store a document with embedding
result = await vector_service.store_note_embedding(
    note_id="note-123",
    content="This is a sample document",
    embedding=[0.1, 0.2, 0.3, ...],  # 1536-dimensional vector
    workspace_id="workspace-456",
    created_by="user-789",
    note_metadata={"title": "Sample Note"}
)
```

### 2. Search Similar Documents

```python
# Search for similar documents
search_result = await vector_service.search_knowledge_base(
    query_vector=[0.1, 0.2, 0.3, ...],
    workspace_id="workspace-456",
    limit=10
)
```

### 3. Direct Weaviate Client Usage

```python
from app.ai.embeddings.vector_db.weaviate_client import WeaviateClient

# Initialize client
client = WeaviateClient()

# Connect
await client.connect()

# Store vectors
objects = [{
    "id": "doc-1",
    "data": {"content": "Sample content"},
    "vector": [0.1, 0.2, 0.3, ...]
}]

stored_ids = await client.store_vectors("Document", objects)

# Search vectors
results = await client.search_vectors(
    class_name="Document",
    query_vector=[0.1, 0.2, 0.3, ...],
    limit=5
)
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check container health
docker ps

# Check Weaviate logs
docker logs my-agents-weaviate

# Check Weaviate metrics
curl http://localhost:8080/v1/meta
```

### Data Persistence

Weaviate data is persisted in the `weaviate_data` Docker volume:

```bash
# Backup data
docker run --rm -v my-agents_weaviate_data:/data -v $(pwd):/backup alpine tar czf /backup/weaviate-backup.tar.gz -C /data .

# Restore data
docker run --rm -v my-agents_weaviate_data:/data -v $(pwd):/backup alpine tar xzf /backup/weaviate-backup.tar.gz -C /data
```

### Performance Tuning

For production use, consider:

1. **Memory**: Increase container memory limits
2. **Batch Size**: Adjust `WEAVIATE_BATCH_SIZE` based on your data
3. **Indexing**: Configure vector index settings for your use case
4. **Clustering**: Set up Weaviate cluster for high availability

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if Weaviate is running
   docker ps | grep weaviate
   
   # Check logs
   docker logs my-agents-weaviate
   ```

2. **Schema Creation Failed**
   ```bash
   # Check existing schema
   curl http://localhost:8080/v1/schema
   
   # Reset schema (WARNING: This deletes all data)
   curl -X DELETE http://localhost:8080/v1/schema
   ```

3. **Out of Memory**
   ```bash
   # Check container memory usage
   docker stats my-agents-weaviate
   
   # Increase memory limits in docker-compose
   ```

### Logs and Debugging

```bash
# View Weaviate logs
docker logs -f my-agents-weaviate

# Check application logs
tail -f backend/logs/app.log

# Test connection from application
python scripts/setup_weaviate.py test
```

## Production Considerations

### Security

1. **Authentication**: Enable API key authentication
2. **Network**: Use internal networks, not exposed ports
3. **TLS**: Enable HTTPS for production
4. **Access Control**: Implement proper access controls

### Scaling

1. **Horizontal Scaling**: Use Weaviate cluster mode
2. **Load Balancing**: Implement load balancer for multiple nodes
3. **Monitoring**: Set up monitoring and alerting
4. **Backup**: Implement regular backup strategy

### Performance

1. **Hardware**: Use SSD storage, sufficient RAM
2. **Indexing**: Optimize vector index configuration
3. **Caching**: Implement application-level caching
4. **Batch Operations**: Use batch operations for bulk data

## Support

- **Weaviate Documentation**: https://weaviate.io/developers/weaviate
- **Weaviate Community**: https://github.com/weaviate/weaviate
- **Application Issues**: Check the project repository issues
