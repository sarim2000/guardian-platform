# Deployment Guide

This guide covers deploying Guardian Platform to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
  - [Docker Compose](#docker-compose-production)
  - [Kubernetes](#kubernetes)
  - [AWS ECS](#aws-ecs)
  - [Vercel](#vercel)
  - [Traditional VPS](#traditional-vps)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **Domain and SSL**
   - Domain name configured
   - SSL certificates (Let's Encrypt recommended)

2. **External Services**
   - GitHub App created and configured
   - AWS IAM credentials (if using AWS discovery)
   - LlamaIndex Cloud API key
   - OpenAI API key

3. **Database**
   - PostgreSQL 14+ with pgvector extension
   - Minimum 2GB RAM, 10GB storage

4. **Compute Resources**
   - Minimum: 2 vCPUs, 4GB RAM
   - Recommended: 4 vCPUs, 8GB RAM

## Environment Configuration

Create a production `.env` file:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/guardian?sslmode=require

# GitHub App
GITHUB_APP_ID=your-app-id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...your key here...
-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID=your-installation-id

# AWS (Optional)
AWS_CREDENTIALS_ENCRYPTION_KEY=your-32-char-encryption-key

# LlamaIndex
LLAMA_API_KEY=your-llama-api-key
LLAMA_EMBEDDING_MODEL=text-embedding-3-large
LLAMA_CHAT_MODEL=gpt-4-turbo-preview

# OpenAI
LLM_API_KEY=your-openai-api-key

# Security
SESSION_SECRET=your-session-secret
CORS_ORIGIN=https://your-domain.com
```

## Deployment Options

### Docker Compose (Production)

1. **Create docker-compose.prod.yml**:

```yaml
version: '3.8'

services:
  guardian:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    env_file:
      - .env.production
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: guardian
      POSTGRES_USER: guardian
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - guardian
    restart: unless-stopped

volumes:
  postgres_data:
```

2. **Deploy**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes

1. **Create namespace**:
```bash
kubectl create namespace guardian
```

2. **Create secrets**:
```bash
kubectl create secret generic guardian-secrets \
  --from-env-file=.env.production \
  -n guardian
```

3. **Apply manifests**:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guardian
  namespace: guardian
spec:
  replicas: 3
  selector:
    matchLabels:
      app: guardian
  template:
    metadata:
      labels:
        app: guardian
    spec:
      containers:
      - name: guardian
        image: your-registry/guardian:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: guardian-secrets
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: guardian
  namespace: guardian
spec:
  selector:
    app: guardian
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

4. **Deploy**:
```bash
kubectl apply -f deployment.yaml
```

### AWS ECS

1. **Build and push image**:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
docker build -t guardian .
docker tag guardian:latest $ECR_URI/guardian:latest
docker push $ECR_URI/guardian:latest
```

2. **Task definition**:
```json
{
  "family": "guardian",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "guardian",
      "image": "${ECR_URI}/guardian:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:guardian/db"
        }
      ]
    }
  ]
}
```

### Vercel

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Configure project**:
```bash
vercel link
```

3. **Set environment variables**:
```bash
vercel env add DATABASE_URL production
vercel env add GITHUB_APP_ID production
# Add all other variables
```

4. **Deploy**:
```bash
vercel --prod
```

### Traditional VPS

1. **Install dependencies**:
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo apt-get install -y postgresql-14-pgvector

# Install PM2
sudo npm install -g pm2
```

2. **Setup application**:
```bash
# Clone repository
git clone https://github.com/your-org/guardian-platform.git
cd guardian-platform

# Install dependencies
npm install

# Build application
npm run build

# Run migrations
npm run db:migrate
```

3. **Configure PM2**:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'guardian',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

4. **Start application**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Test service discovery
curl https://your-domain.com/api/services

# Verify database connection
npm run db:studio
```

### 2. Configure Scheduled Jobs

Set up cron jobs or scheduled tasks for:

```bash
# Service discovery sync (every 4 hours)
0 */4 * * * curl -X POST https://your-domain.com/api/catalog/ingestion/trigger

# AWS resource discovery (daily)
0 2 * * * curl -X POST https://your-domain.com/api/aws/discover
```

### 3. Setup Backups

```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > $BACKUP_DIR/guardian_$TIMESTAMP.sql
```

## Monitoring

### 1. Health Checks

Monitor these endpoints:
- `/api/health` - Overall health
- `/api/health/db` - Database connectivity
- `/api/health/github` - GitHub API access
- `/api/health/aws` - AWS API access

### 2. Metrics to Track

- Response times
- Error rates
- Database query performance
- Service discovery sync status
- Memory and CPU usage

### 3. Recommended Tools

- **Application Monitoring**: New Relic, DataDog, or Sentry
- **Infrastructure**: CloudWatch, Prometheus + Grafana
- **Logs**: ELK Stack or CloudWatch Logs
- **Uptime**: UptimeRobot or Pingdom

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. **GitHub API Rate Limits**
   - Implement caching
   - Use webhook events
   - Increase sync intervals

3. **Memory Issues**
   ```bash
   # Increase Node.js memory
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

4. **SSL Certificate Issues**
   ```bash
   # Renew Let's Encrypt
   certbot renew --nginx
   ```

### Performance Optimization

1. **Database**
   - Add indexes for frequently queried columns
   - Use connection pooling
   - Regular VACUUM and ANALYZE

2. **Application**
   - Enable production mode
   - Use CDN for static assets
   - Implement caching strategies

3. **Infrastructure**
   - Use horizontal scaling
   - Implement load balancing
   - Enable auto-scaling

## Security Hardening

1. **Network Security**
   ```bash
   # Configure firewall
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Application Security**
   - Enable CORS restrictions
   - Implement rate limiting
   - Use security headers
   - Regular security updates

3. **Database Security**
   - Use SSL connections
   - Implement connection limits
   - Regular backups
   - Audit logging

## Rollback Procedure

1. **Docker/Kubernetes**
   ```bash
   # Rollback to previous version
   kubectl rollout undo deployment/guardian -n guardian
   ```

2. **Traditional Deployment**
   ```bash
   # Keep previous builds
   pm2 stop guardian
   git checkout previous-tag
   npm install
   npm run build
   pm2 start guardian
   ```

## Support

For deployment issues:
- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Open an issue on GitHub
- Contact support@guardian-platform.com