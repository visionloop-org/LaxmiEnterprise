# Docker Deployment Guide

## Quick Start

### Single Command Launch
Run the launch script to start all containers:
```bash
.\launch-containers.bat
```

### Manual Launch
```bash
docker-compose up --build
```

### Stop Containers
```bash
docker-compose down
```

## Services

The docker-compose.yml orchestrates the following services:

1. **MongoDB** - Database (port 27017)
2. **Backend API** - FastAPI server (port 8000)
3. **Supervisor App** - React frontend (port 5173)
4. **Admin App** - React frontend (port 5174)

## Access Points

- **Supervisor App**: http://localhost:5173
- **Admin App**: http://localhost:5174
- **Backend API**: http://localhost:8000
- **MongoDB**: mongodb://localhost:27017

## Environment Variables

The containers use the following environment variables:

### Backend
- `MONGODB_URI=mongodb://mongodb:27017/laxmi_enterprise`
- `DEBUG=True`

### Frontend Apps
- `VITE_API_BASE_URL=http://backend:8000/api/v1`

## Volume Persistence

MongoDB data is persisted in a Docker volume named `mongodb_data` to survive container restarts.

## Network

All services communicate via a dedicated Docker network named `laxmi-network`.

## Development vs Production

The current setup is configured for development. For production deployment:

1. Update environment variables for production settings
2. Use production builds for React apps
3. Add proper SSL/TLS configuration
4. Implement proper logging and monitoring
5. Set up proper backup strategies

## Troubleshooting

### Container Won't Start
```bash
docker-compose logs <service_name>
```

### Rebuild Specific Service
```bash
docker-compose up --build <service_name>
```

### Clean Restart
```bash
docker-compose down -v
docker-compose up --build
```

### View Running Containers
```bash
docker-compose ps
```

## Requirements

- Docker Desktop installed and running
- Docker Compose installed
- At least 4GB RAM available for Docker
