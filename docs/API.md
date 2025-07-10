# API Reference

Guardian Platform provides RESTful APIs for integration with external systems.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

Currently, the API uses session-based authentication. API key authentication is planned for future releases.

## Endpoints

### Services

#### List Services
```http
GET /api/services
```

Query parameters:
- `team` (string): Filter by team name
- `lifecycle` (string): Filter by lifecycle stage
- `type` (string): Filter by service type

Response:
```json
[
  {
    "id": "uuid",
    "name": "service-name",
    "displayName": "Service Display Name",
    "description": "Service description",
    "ownerTeam": "team-name",
    "lifecycle": "production",
    "type": "api"
  }
]
```

#### Get Service Details
```http
GET /api/services/[id]
```

Response:
```json
{
  "id": "uuid",
  "name": "service-name",
  "displayName": "Service Display Name",
  "description": "Service description",
  "ownerTeam": "team-name",
  "ownerEmail": "team@example.com",
  "lifecycle": "production",
  "tier": "tier1",
  "type": "api",
  "partOf": "platform-name",
  "techStack": ["Node.js", "PostgreSQL"],
  "links": [
    {
      "name": "Documentation",
      "url": "https://docs.example.com"
    }
  ],
  "repositoryUrl": "https://github.com/org/repo",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Get Service by Catalog
```http
GET /api/services/catalog/[catalog]
```

Get services from a specific repository catalog.

### Service Discovery

#### Trigger Service Discovery
```http
POST /api/catalog/ingestion/trigger
```

Triggers a scan of all configured repositories for service manifests.

Response:
```json
{
  "message": "Ingestion triggered successfully",
  "repositories": 42,
  "services": 15
}
```

### AWS Resources

#### List AWS Resources
```http
GET /api/aws/resources
```

Query parameters:
- `accountId` (string): Filter by AWS account
- `region` (string): Filter by region
- `service` (string): Filter by AWS service
- `type` (string): Filter by resource type

Response:
```json
[
  {
    "id": "uuid",
    "resourceId": "i-1234567890abcdef0",
    "resourceName": "web-server-1",
    "resourceType": "EC2_Instance",
    "service": "EC2",
    "region": "us-east-1",
    "accountId": "123456789012",
    "tags": {
      "Environment": "production",
      "Team": "platform"
    }
  }
]
```

#### Trigger AWS Discovery
```http
POST /api/aws/discover
```

Triggers discovery of AWS resources across all configured accounts.

Response:
```json
{
  "message": "AWS discovery triggered",
  "accounts": 3,
  "regions": ["us-east-1", "us-west-2"]
}
```

#### List AWS Accounts
```http
GET /api/aws/accounts
```

Response:
```json
[
  {
    "id": "uuid",
    "accountId": "123456789012",
    "accountName": "Production",
    "regions": ["us-east-1", "us-west-2"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Chat

#### Send Chat Message
```http
POST /api/chat
```

Request body:
```json
{
  "message": "How do I deploy the user service?",
  "serviceId": "uuid" // Optional: scope to specific service
}
```

Response (streaming):
```
data: {"content": "To deploy the user service..."}
data: {"content": "1. First, ensure..."}
data: {"done": true}
```

### Organizations

#### Get Organization Info
```http
GET /api/organizations
```

Response:
```json
{
  "name": "Your Organization",
  "repositories": 42,
  "services": 156,
  "teams": 12
}
```

### Repositories

#### List Repositories
```http
GET /api/repositories
```

Query parameters:
- `hasServices` (boolean): Filter repositories with services

Response:
```json
[
  {
    "id": 123456,
    "name": "repository-name",
    "fullName": "org/repository-name",
    "description": "Repository description",
    "url": "https://github.com/org/repository-name",
    "defaultBranch": "main",
    "services": 3
  }
]
```

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `INTERNAL_ERROR` - Server error

## Rate Limiting

API rate limits:
- Authenticated: 1000 requests per hour
- Service discovery: 10 triggers per hour
- AWS discovery: 5 triggers per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks (Coming Soon)

Future support for webhooks to receive real-time updates:
- Service changes
- AWS resource changes
- Discovery completion
- System alerts

## SDK Support (Coming Soon)

Official SDKs planned for:
- JavaScript/TypeScript
- Python
- Go
- Java