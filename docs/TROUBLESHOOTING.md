# Troubleshooting Guide

This guide helps you resolve common issues with Guardian Platform.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [GitHub Integration Issues](#github-integration-issues)
- [AWS Discovery Issues](#aws-discovery-issues)
- [Chat Feature Issues](#chat-feature-issues)
- [Performance Issues](#performance-issues)
- [Docker Issues](#docker-issues)
- [Common Errors](#common-errors)

## Installation Issues

### npm install fails

**Problem:** Dependencies fail to install

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, try with legacy peer deps
npm install --legacy-peer-deps
```

### Node version mismatch

**Problem:** Wrong Node.js version

**Solution:**
```bash
# Check current version
node --version

# Install correct version with nvm
nvm install 20
nvm use 20

# Set as default
nvm alias default 20
```

## Database Issues

### Connection refused

**Problem:** Cannot connect to PostgreSQL

**Solutions:**

1. **Check PostgreSQL is running:**
```bash
# Linux/Mac
sudo systemctl status postgresql
# or
brew services list | grep postgresql

# Docker
docker ps | grep postgres
```

2. **Verify connection string:**
```bash
# Test connection
psql "postgresql://user:password@localhost:5432/guardian"

# Common format
DATABASE_URL="postgresql://guardian:password@localhost:5432/guardian?sslmode=disable"
```

3. **Check pgvector extension:**
```sql
-- Connect to database
psql -U postgres -d guardian

-- Create extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
\dx
```

### Migration failures

**Problem:** Database migrations fail

**Solutions:**

1. **Reset migrations:**
```bash
# Drop all tables (CAUTION: Data loss)
npm run db:drop

# Re-run migrations
npm run db:migrate
```

2. **Manual migration:**
```bash
# Generate SQL
npm run db:generate

# Apply manually
psql $DATABASE_URL < drizzle/0001_migration.sql
```

### pgvector not found

**Problem:** pgvector extension missing

**Solution for different systems:**

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-14-pgvector

# macOS
brew install pgvector

# Docker
# Use pgvector/pgvector:pg16 image

# Build from source
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
make install
```

## GitHub Integration Issues

### Invalid private key

**Problem:** GitHub App authentication fails

**Solutions:**

1. **Check key format:**
```bash
# Key should start with
-----BEGIN RSA PRIVATE KEY-----

# If downloaded as .pem file
cat github-app-key.pem

# Copy entire content including headers
```

2. **Environment variable format:**
```bash
# In .env file, use quotes
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...rest of key...
-----END RSA PRIVATE KEY-----"
```

### Rate limit exceeded

**Problem:** GitHub API rate limits hit

**Solutions:**

1. **Check current limits:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/rate_limit
```

2. **Implement caching:**
```typescript
// Add to API routes
const CACHE_DURATION = 3600; // 1 hour
```

3. **Reduce sync frequency:**
```bash
# Instead of hourly, run every 4 hours
0 */4 * * * curl -X POST https://your-domain/api/catalog/ingestion/trigger
```

### Repository access denied

**Problem:** Cannot read repositories

**Solutions:**

1. **Verify app permissions:**
   - Go to GitHub Settings → Apps
   - Check "Repository permissions"
   - Ensure "Contents: Read" is granted

2. **Check installation:**
   - Verify app is installed on organization
   - Check specific repository access

3. **Correct installation ID:**
```bash
# Get from URL when viewing installation
# https://github.com/settings/installations/12345678
GITHUB_APP_INSTALLATION_ID=12345678
```

## AWS Discovery Issues

### Invalid credentials

**Problem:** AWS API authentication fails

**Solutions:**

1. **Test credentials:**
```bash
# Set environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret

# Test
aws sts get-caller-identity
```

2. **Check encryption key:**
```bash
# Generate new key if needed
openssl rand -base64 32

# Update in .env
AWS_CREDENTIALS_ENCRYPTION_KEY=new-key-here
```

### No resources discovered

**Problem:** AWS discovery returns empty

**Solutions:**

1. **Check IAM permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "ec2:Describe*",
      "rds:Describe*",
      "lambda:List*",
      "s3:ListAllMyBuckets",
      "tag:GetResources"
    ],
    "Resource": "*"
  }]
}
```

2. **Verify regions:**
```typescript
// Check configured regions in
// src/services/aws-multi-account-discovery.ts
const regions = ['us-east-1', 'us-west-2'];
```

## Chat Feature Issues

### No response from chat

**Problem:** Chat queries return empty

**Solutions:**

1. **Check LlamaIndex API:**
```bash
# Test API key
curl -H "Authorization: Bearer $LLAMA_API_KEY" \
  https://api.llamaindex.ai/v1/models
```

2. **Verify embeddings:**
```sql
-- Check if embeddings exist
SELECT COUNT(*) FROM document_embeddings;

-- Check vector dimensions
SELECT vector_dims(embedding) FROM document_embeddings LIMIT 1;
```

3. **Re-index documents:**
```bash
# Trigger re-indexing
curl -X POST http://localhost:3000/api/ingest
```

### Slow chat responses

**Problem:** Chat takes too long

**Solutions:**

1. **Optimize vector search:**
```sql
-- Create index
CREATE INDEX ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

2. **Reduce context size:**
```typescript
// In chat configuration
const MAX_CONTEXT_LENGTH = 2000; // Reduce if needed
```

## Performance Issues

### Slow page loads

**Problem:** Application feels sluggish

**Solutions:**

1. **Enable production mode:**
```bash
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

2. **Check database queries:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

3. **Add database indexes:**
```sql
-- Common indexes
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_services_owner_team ON services(owner_team);
CREATE INDEX idx_aws_resources_type ON aws_resources(resource_type);
```

### High memory usage

**Problem:** Application uses too much memory

**Solutions:**

1. **Increase Node.js memory:**
```bash
# In package.json or start script
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

2. **Check for memory leaks:**
```bash
# Use Node.js profiler
node --inspect npm start

# Connect Chrome DevTools to inspect
```

## Docker Issues

### Container won't start

**Problem:** Docker container fails

**Solutions:**

1. **Check logs:**
```bash
docker logs guardian-nextjs-guardian-1
```

2. **Verify environment:**
```bash
# Check if .env.local exists
docker exec container-name ls -la

# Check environment variables
docker exec container-name env
```

3. **Database connection in Docker:**
```yaml
# In compose.yml, use service name
DATABASE_URL: "postgresql://guardian:password@postgres:5432/guardian"
```

### Build failures

**Problem:** Docker build fails

**Solutions:**

1. **Clear Docker cache:**
```bash
docker system prune -a
docker build --no-cache -t guardian .
```

2. **Check Dockerfile:**
```dockerfile
# Ensure all files are copied
COPY package*.json ./
COPY . .
```

## Common Errors

### "Cannot find module" errors

**Solution:**
```bash
# Rebuild
npm run build

# Clear Next.js cache
rm -rf .next
npm run dev
```

### "ECONNREFUSED" errors

**Solutions:**
1. Check service is running
2. Verify correct port
3. Check firewall rules
4. Use correct hostname (localhost vs 127.0.0.1)

### "Invalid token" errors

**Solutions:**
1. Regenerate API keys
2. Check token expiration
3. Verify correct environment
4. Clear browser cache

### TypeScript errors

**Solution:**
```bash
# Regenerate types
npm run db:generate

# Clear TypeScript cache
rm -rf node_modules/.cache/typescript
```

## Getting Help

If these solutions don't resolve your issue:

1. **Check logs:**
   - Application logs
   - Database logs
   - Browser console
   - Network tab

2. **Gather information:**
   - Node.js version
   - PostgreSQL version
   - Error messages
   - Steps to reproduce

3. **Get support:**
   - Search existing [GitHub Issues](https://github.com/sarim2000/guardian-platform/issues)
   - Create detailed issue report
   - Join community Discord
   - Email: support@guardian-platform.com

## Debug Mode

Enable debug logging:

```bash
# Set in environment
DEBUG=guardian:* npm run dev

# Or in code
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

## Health Checks

Use these endpoints to diagnose issues:

```bash
# Overall health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/db

# External services
curl http://localhost:3000/api/health/github
curl http://localhost:3000/api/health/aws
```