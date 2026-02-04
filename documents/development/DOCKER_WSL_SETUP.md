# Docker with WSL 2 Setup Guide

This guide documents how to set up Docker Engine with Windows Subsystem for Linux (WSL 2) using Ubuntu.

## Prerequisites

- Windows 10 version 2004 or higher, or Windows 11
- Administrator access

## Installation Steps

### Step 1: Install WSL 2 with Ubuntu

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

This will:
- Enable WSL feature
- Install WSL 2
- Install Ubuntu as the default distribution

After installation, create a Unix user account when prompted.

### Step 2: Set WSL 2 as Default Version

```powershell
wsl --set-default-version 2
```

Verify the installation:

```powershell
wsl --list --verbose
```

Expected output:
```
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

### Step 3: Install Docker Engine in Ubuntu WSL

#### Add Docker's GPG Key

```powershell
wsl -d Ubuntu -u root -- bash -c "install -m 0755 -d /etc/apt/keyrings && curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && chmod a+r /etc/apt/keyrings/docker.asc"
```

#### Add Docker Repository

```powershell
wsl -d Ubuntu -u root -- bash -c 'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null'
```

#### Update Packages and Install Docker

```powershell
wsl -d Ubuntu -u root -- bash -c 'apt-get update'

wsl -d Ubuntu -u root -- bash -c 'apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin'
```

### Step 4: Configure Docker

#### Add Your User to the Docker Group

Replace `<your-username>` with your Ubuntu username:

```powershell
wsl -d Ubuntu -u root -- bash -c 'usermod -aG docker <your-username>'
```

#### Start Docker Service

```powershell
wsl -d Ubuntu -u root -- bash -c 'service docker start'
```

### Step 5: Verify Installation

```powershell
# Check Docker version
wsl -d Ubuntu -- docker --version

# Check Docker Compose version
wsl -d Ubuntu -- docker compose version

# Test Docker
wsl -d Ubuntu -- docker run hello-world
```

## Installed Versions

| Component | Version |
|-----------|---------|
| WSL | 2.6.3 |
| Ubuntu | WSL 2 |
| Docker Engine | 29.2.1 |
| Docker Compose | v5.0.2 |

## Running Docker Compose Infrastructure

### Start Services

Navigate to the development folder and start the infrastructure:

```powershell
wsl -d Ubuntu -- bash -c 'cd /mnt/c/Projects/GitHub/my-agents/documents/development && docker compose -f docker-compose-infra.yml up -d'
```

### Infrastructure Services

| Service | Container | Port(s) | Description |
|---------|-----------|---------|-------------|
| **PostgreSQL** | my-agents-postgres | `5432` | Primary database |
| **Redis** | my-agents-redis | `6379` | Caching and sessions |
| **Qdrant** | my-agents-qdrant | `6333` (REST), `6334` (gRPC) | Vector database |
| **MinIO** | my-agents-minio | `9000` (API), `9001` (Console) | S3-compatible file storage |

### Connection Details

| Service | Connection String / URL |
|---------|------------------------|
| **PostgreSQL** | `postgresql://postgres:postgres123@localhost:5432/my_agents_db` |
| **Redis** | `redis://:redis_password_123@localhost:6379` |
| **Qdrant** | `http://localhost:6333` (API Key: `qdrant-admin-key-123`) |
| **MinIO Console** | `http://localhost:9001` (User: `minioadmin`, Pass: `minioadmin123`) |

### Check Container Status

```powershell
wsl -d Ubuntu -- docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## Useful Commands

### Docker Compose Commands

```powershell
# View logs (follow mode)
wsl -d Ubuntu -- bash -c 'cd /mnt/c/Projects/GitHub/my-agents/documents/development && docker compose -f docker-compose-infra.yml logs -f'

# View logs for specific service
wsl -d Ubuntu -- bash -c 'cd /mnt/c/Projects/GitHub/my-agents/documents/development && docker compose -f docker-compose-infra.yml logs -f postgres'

# Stop all services
wsl -d Ubuntu -- bash -c 'cd /mnt/c/Projects/GitHub/my-agents/documents/development && docker compose -f docker-compose-infra.yml down'

# Stop and remove volumes (WARNING: deletes all data)
wsl -d Ubuntu -- bash -c 'cd /mnt/c/Projects/GitHub/my-agents/documents/development && docker compose -f docker-compose-infra.yml down -v'

# Restart services
wsl -d Ubuntu -- bash -c 'cd /mnt/c/Projects/GitHub/my-agents/documents/development && docker compose -f docker-compose-infra.yml restart'

# Rebuild and restart
wsl -d Ubuntu -- bash -c 'cd /mnt/c/Projects/GitHub/my-agents/documents/development && docker compose -f docker-compose-infra.yml up -d --build'
```

### Docker Service Commands

```powershell
# Start Docker service (run after WSL restart)
wsl -d Ubuntu -u root -- bash -c 'service docker start'

# Check Docker service status
wsl -d Ubuntu -u root -- bash -c 'service docker status'
```

### WSL Commands

```powershell
# Enter Ubuntu WSL
wsl -d Ubuntu

# Shutdown WSL
wsl --shutdown

# List all distributions
wsl --list --verbose
```

## Using Docker from Ubuntu Terminal

For a better experience, you can enter the Ubuntu terminal directly:

```powershell
wsl -d Ubuntu
```

Then use Docker commands normally:

```bash
cd /mnt/c/Projects/GitHub/my-agents/documents/development
docker compose -f docker-compose-infra.yml up -d
docker ps
docker logs -f my-agents-postgres
```

## Troubleshooting

### Docker Service Not Running

If you get "Cannot connect to the Docker daemon" error:

```powershell
wsl -d Ubuntu -u root -- bash -c 'service docker start'
```

### Permission Denied

If you get permission denied errors, ensure your user is in the docker group:

```powershell
wsl -d Ubuntu -u root -- bash -c 'usermod -aG docker <your-username>'
```

Then restart WSL:

```powershell
wsl --shutdown
wsl -d Ubuntu
```

### Port Already in Use

Check if ports are already in use:

```powershell
netstat -ano | findstr :5432
netstat -ano | findstr :6379
```

### Reset WSL Ubuntu

If you need to start fresh:

```powershell
wsl --unregister Ubuntu
wsl --install -d Ubuntu
```

## Enabling Systemd (Optional)

To make Docker start automatically when WSL starts, enable systemd:

```powershell
wsl -d Ubuntu -u root -- bash -c 'echo -e "[boot]\nsystemd=true" > /etc/wsl.conf'
```

Then restart WSL:

```powershell
wsl --shutdown
```

After restarting, Docker will start automatically.
