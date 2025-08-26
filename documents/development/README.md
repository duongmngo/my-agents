# Development Environment Setup

This directory contains the Docker Compose setup for running the complete my-agents application stack in development.

## Services

The development environment includes:

- **PostgreSQL** - Main database
- **Redis** - Caching and session storage
- **MinIO** - S3-compatible file storage
- **Backend API** - FastAPI application
- **Frontend** - Next.js application (optional)
- **Nginx** - Reverse proxy (optional)

## Quick Start

1. **Copy environment file:**
   ```bash
   cp env-example .env
   # Edit .env with your preferred settings
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Check service health:**
   ```bash
   docker-compose ps
   ```

4. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f backend
   ```

## Service URLs

- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Frontend:** http://localhost:3000
- **MinIO Console:** http://localhost:9001
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## Default Credentials

### PostgreSQL
- **Database:** my_agents_db
- **Username:** postgres
- **Password:** postgres123

### MinIO
- **Access Key:** minioadmin
- **Secret Key:** minioadmin123
- **Console:** http://localhost:9001

### Redis
- **URL:** redis://localhost:6379
- **No password required**

## Development Workflow

### Backend Development

1. **Install dependencies:**
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

2. **Run database migrations:**
   ```bash
   # From backend directory
   alembic upgrade head
   ```

3. **Start backend only:**
   ```bash
   docker-compose up -d postgres redis minio
   # Then run FastAPI locally
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Downgrade migrations
alembic downgrade -1
```

### Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test
pytest tests/test_auth.py
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Check if ports 5432, 6379, 8000, 9000, 9001, 3000 are available
   - Modify port mappings in docker-compose.yml if needed

2. **Database connection issues:**
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres
   
   # Reset database
   docker-compose down -v
   docker-compose up -d postgres
   ```

3. **File storage issues:**
   ```bash
   # Check MinIO logs
   docker-compose logs minio
   
   # Access MinIO console to create buckets
   open http://localhost:9001
   ```

4. **Permission errors:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER ../backend
   ```

### Debugging

1. **Enter container:**
   ```bash
   docker-compose exec backend bash
   docker-compose exec postgres psql -U postgres -d my_agents_db
   ```

2. **Check service health:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **View real-time logs:**
   ```bash
   docker-compose logs -f --tail=100 backend
   ```

## Production Considerations

This setup is for development only. For production:

1. **Security:**
   - Change all default passwords
   - Use proper SSL certificates
   - Configure firewall rules
   - Use secrets management

2. **Performance:**
   - Use production-grade databases
   - Configure connection pooling
   - Set up proper caching
   - Optimize container resources

3. **Monitoring:**
   - Add logging aggregation
   - Set up health checks
   - Configure alerts
   - Monitor resource usage

## Data Persistence

Data is persisted in Docker volumes:
- `postgres_data` - Database data
- `redis_data` - Cache data
- `minio_data` - File storage

To reset all data:
```bash
docker-compose down -v
```

## Scaling

For development scaling:
```bash
# Scale backend replicas
docker-compose up -d --scale backend=3

# Scale with load balancer
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```