# Docker Guide for Guardian Platform

This guide explains how to build and run the Guardian Platform using Docker.

## Dockerfile Improvements

The Dockerfile has been optimized with the following improvements:

### 1. **Multi-stage Build Optimization**
- Separate stages for dependencies, building, and runtime
- Reduced final image size by only including production dependencies
- Better layer caching for faster rebuilds

### 2. **Security Enhancements**
- Specific Node.js version pinning for reproducibility
- Non-root user execution
- Minimal Alpine Linux base image
- Proper signal handling with dumb-init

### 3. **Build Performance**
- Optimized dependency installation with npm ci
- Separate production and development dependencies
- Docker build context optimization with .dockerignore
- Parallel operations where possible

### 4. **Production Ready Features**
- Health check endpoint at `/api/health`
- Proper environment variable handling
- Error handling and informative build messages
- Container labels for better management

## Building the Docker Image

### Production Build

```bash
# Build the production image
docker build -t guardian-platform:latest .

# Build with specific Node version
docker build --build-arg NODE_VERSION=20.18.0 -t guardian-platform:latest .
```

### Development Build

```bash
# Build the development image
docker build -f Dockerfile.dev -t guardian-platform:dev .
```

## Running the Container

### Production

```bash
# Run with environment variables from file
docker run -d \
  --name guardian-platform \
  -p 3000:3000 \
  --env-file .env.production \
  guardian-platform:latest

# Run with individual environment variables
docker run -d \
  --name guardian-platform \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e GITHUB_APP_ID="..." \
  -e GITHUB_APP_PRIVATE_KEY="..." \
  # ... other required env vars
  guardian-platform:latest
```

### Development

```bash
# Run development container with volume mounts
docker run -d \
  --name guardian-platform-dev \
  -p 3000:3000 \
  -p 5555:5555 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/public:/app/public \
  -v $(pwd)/.env.local:/app/.env.local \
  --env-file .env.local \
  guardian-platform:dev
```

## Docker Compose

Use the provided `compose.yml` for a complete development environment:

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

## Environment Variables

During the Docker build process, environment validation is skipped by setting `SKIP_ENV_VALIDATION=1`. This allows the image to be built without all environment variables present.

Required environment variables must be provided at runtime:

- `DATABASE_URL`
- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_APP_INSTALLATION_ID`
- `AWS_CREDENTIALS_ENCRYPTION_KEY`
- `LLAMA_API_KEY`
- `LLM_API_KEY`
- `LLM_MODEL`
- `EMBEDDING_API_KEY`
- `EMBEDDING_MODEL`

## Health Check

The container includes a health check that queries `/api/health` every 30 seconds. You can check the container health status:

```bash
docker ps
docker inspect guardian-platform --format='{{.State.Health.Status}}'
```

## Troubleshooting

### Build Failures

If the build fails:

1. Check that all required files are present
2. Ensure you have enough disk space
3. Try clearing Docker cache: `docker builder prune`
4. Check the build logs for specific errors

### Runtime Issues

1. Verify all required environment variables are set
2. Check container logs: `docker logs guardian-platform`
3. Ensure the database is accessible from the container
4. Verify port 3000 is not already in use

### Performance Optimization

1. Use BuildKit for faster builds: `DOCKER_BUILDKIT=1 docker build .`
2. Leverage build cache by not changing early layers
3. Use `.dockerignore` to exclude unnecessary files
4. Consider using a Docker registry for base images

## Image Size Comparison

The optimized Dockerfile reduces the final image size significantly:

- Base Node.js image: ~180MB
- With all dependencies: ~400MB
- Final optimized image: ~250MB (approximately 40% reduction)

## Security Considerations

1. Never include secrets in the Docker image
2. Always run as non-root user (nextjs)
3. Keep base images updated
4. Scan images for vulnerabilities: `docker scan guardian-platform:latest`
5. Use specific version tags instead of `latest` in production