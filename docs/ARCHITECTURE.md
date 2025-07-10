# Architecture Overview

Guardian Platform is built with a modern, scalable architecture designed for extensibility and performance.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Pages     │  │  Components  │  │   State Management     │ │
│  │  App Router │  │  Mantine UI  │  │   React Hooks          │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js API)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Services   │  │     Chat     │  │    AWS Discovery       │ │
│  │  Catalog    │  │  LlamaIndex  │  │    Multi-Account       │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌──────────┴───────────┬─────────────┐
                    ▼                      ▼             ▼
┌─────────────────────────┐  ┌──────────────────┐  ┌──────────────┐
│     PostgreSQL          │  │   GitHub API     │  │   AWS APIs   │
│   ┌─────────────┐       │  │                  │  │              │
│   │  pgvector   │       │  │  - Repositories  │  │  - EC2       │
│   │  Extension  │       │  │  - Contents      │  │  - RDS       │
│   └─────────────┘       │  │  - Search        │  │  - Lambda    │
│                         │  │                  │  │  - S3        │
└─────────────────────────┘  └──────────────────┘  └──────────────┘
```

## Core Components

### 1. Frontend Layer

**Technology Stack:**
- Next.js 15 with App Router
- React 19
- Mantine UI Components
- Recharts for visualizations
- React Flow for dependency graphs

**Key Features:**
- Server-side rendering for performance
- Parallel routing for chat modal
- Responsive design
- Real-time updates

### 2. API Layer

**Endpoints:**

```
/api/services          - Service CRUD operations
/api/services/catalog  - Service discovery from GitHub
/api/aws/resources     - AWS resource management
/api/aws/discover      - AWS resource discovery
/api/chat             - AI-powered chat interface
/api/organizations    - Organization management
/api/repositories     - GitHub repository management
```

**Authentication:**
- Session-based authentication
- API key support for automation
- GitHub App authentication

### 3. Data Layer

**Database Schema:**

```sql
-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  description TEXT,
  owner_team VARCHAR(255),
  owner_email VARCHAR(255),
  lifecycle VARCHAR(50),
  tier VARCHAR(50),
  type VARCHAR(50),
  part_of VARCHAR(255),
  tech_stack TEXT[],
  links JSONB,
  repository_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- AWS Resources table
CREATE TABLE aws_resources (
  id UUID PRIMARY KEY,
  resource_id VARCHAR(255),
  resource_name VARCHAR(255),
  resource_type VARCHAR(100),
  service VARCHAR(50),
  region VARCHAR(50),
  account_id VARCHAR(20),
  tags JSONB,
  raw_data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Vector embeddings for chat
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id),
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP
);
```

### 4. External Integrations

**GitHub Integration:**
- GitHub App for repository access
- Webhook support for real-time updates
- GraphQL API for efficient queries

**AWS Integration:**
- Multi-account support
- Encrypted credential storage
- Read-only access patterns
- Region-aware discovery

**LlamaIndex Integration:**
- Document indexing pipeline
- Vector similarity search
- Hybrid search capabilities
- Streaming chat responses

## Data Flow

### Service Discovery Flow

```
1. User triggers discovery
2. API fetches repositories from GitHub
3. Scan for .guardian/*.yml files
4. Parse and validate YAML manifests
5. Store/update service metadata
6. Index documentation for chat
7. Build dependency relationships
```

### Chat Flow

```
1. User sends chat message
2. Query embedding generated
3. Vector similarity search
4. Retrieve relevant documents
5. LLM generates response
6. Stream response to user
```

### AWS Discovery Flow

```
1. Scheduled job triggers
2. Decrypt AWS credentials
3. Query AWS APIs per region
4. Transform resource data
5. Store in database
6. Update resource relationships
```

## Security Architecture

### Authentication & Authorization

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Browser   │────▶│  Next.js App │────▶│  API Routes    │
└─────────────┘     └──────────────┘     └────────────────┘
                            │                      │
                            ▼                      ▼
                    ┌──────────────┐      ┌────────────────┐
                    │   Session    │      │  Permissions   │
                    │   Store      │      │  Middleware    │
                    └──────────────┘      └────────────────┘
```

### Data Security

- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3
- **Credential Management**: Encrypted storage with key rotation
- **Access Control**: Role-based permissions

## Scalability Considerations

### Horizontal Scaling

- Stateless application design
- Database connection pooling
- Cache layer for frequently accessed data
- CDN for static assets

### Performance Optimization

- Database query optimization with indexes
- Lazy loading for large datasets
- Streaming responses for chat
- Background jobs for heavy operations

### Caching Strategy

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Client    │────▶│  CDN Cache   │────▶│  Application   │
└─────────────┘     └──────────────┘     └────────────────┘
                                                  │
                                          ┌───────▼────────┐
                                          │  Redis Cache   │
                                          └───────┬────────┘
                                                  │
                                          ┌───────▼────────┐
                                          │   PostgreSQL   │
                                          └────────────────┘
```

## Deployment Architecture

### Container Architecture

```
┌─────────────────────────────────────────────┐
│              Load Balancer                   │
└─────────────┬─────────────┬─────────────────┘
              │             │
     ┌────────▼───────┐ ┌──▼────────────┐
     │   Guardian     │ │   Guardian    │
     │   Instance 1   │ │   Instance 2  │
     └────────┬───────┘ └──┬────────────┘
              │             │
     ┌────────▼─────────────▼────────────┐
     │         PostgreSQL                 │
     │      (Primary + Replica)          │
     └───────────────────────────────────┘
```

### High Availability

- Multiple application instances
- Database replication
- Health checks and auto-recovery
- Graceful shutdown handling

## Monitoring and Observability

### Metrics Collection

```
Application ──┬──▶ Custom Metrics ──▶ Prometheus
              │
              ├──▶ Logs ────────────▶ ELK Stack
              │
              └──▶ Traces ──────────▶ Jaeger
```

### Key Metrics

- Request latency (p50, p95, p99)
- Error rates
- Database query performance
- External API response times
- Resource utilization

## Development Workflow

### Local Development

```
Developer ──▶ Local Next.js ──▶ Local PostgreSQL
                   │
                   └──▶ Mock External APIs
```

### CI/CD Pipeline

```
Git Push ──▶ GitHub Actions ──▶ Tests ──▶ Build ──▶ Deploy
                │                 │
                └─── Lint ────────┘
```

## Future Architecture Considerations

### Planned Enhancements

1. **Event-Driven Architecture**
   - Message queue for async operations
   - Event sourcing for audit trail
   - Webhook processing

2. **Microservices Migration**
   - Separate chat service
   - Independent discovery workers
   - API gateway

3. **Advanced Features**
   - Real-time collaboration
   - Multi-tenancy support
   - Plugin architecture

### Technology Considerations

- GraphQL API layer
- WebSocket support
- Kubernetes operators
- Service mesh integration