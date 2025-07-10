# 🛡️ Guardian Platform

<p align="center">
  <img src="docs/images/home.png" alt="Guardian Platform Dashboard" width="600"/>
</p>

<p align="center">
  <strong>A comprehensive infrastructure and service discovery platform that provides centralized visibility into your organization's services and cloud resources.</strong>
</p>

<p align="center">
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-architecture">🏗️ Architecture</a> •
  <a href="#-deployment">📦 Deployment</a> •
  <a href="#-api-reference">📚 API</a> •
  <a href="#-contributing">🤝 Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/PostgreSQL-pgvector-336791" alt="PostgreSQL with pgvector" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-20+-green" alt="Node.js" />
</p>

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Service Discovery Setup](#-service-discovery-setup)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Security](#-security)
- [Support](#-support)
- [License](#-license)


## ✨ Features

<table>
<tr>
<td width="50%">

### 🔍 Service Discovery
Automatically catalog services through owner-defined YAML manifests with comprehensive metadata tracking.

<img src="docs/images/services.png" alt="Service Discovery" width="100%"/>

**Key capabilities:**
- Auto-discovery from GitHub repositories
- Service lifecycle tracking
- Ownership and team management
- Dependency visualization

</td>
<td width="50%">

### ☁️ AWS Resource Discovery  
Automated discovery and tracking of cloud infrastructure across multiple AWS accounts.

<img src="docs/images/aws-resources.png" alt="AWS Resources" width="100%"/>

**Key capabilities:**
- Multi-account support
- Resource tagging and filtering
- Cost tracking integration
- Security compliance checks

</td>
</tr>
<tr>
<td width="50%">

### 💬 AI-Powered Documentation Chat
Intelligent conversations with service documentation using LlamaIndex for contextual retrieval.

<img src="docs/images/chat.png" alt="Documentation Chat" width="100%"/>

**Key capabilities:**
- Natural language queries
- Context-aware responses
- Code examples and snippets
- Multi-service knowledge base

</td>
<td width="50%">

### 📊 Admin Dashboard
Centralized control panel for managing the platform, users, and system configuration.

<img src="docs/images/admin.png" alt="Admin Dashboard" width="100%"/>

**Key capabilities:**
- User access management
- System health monitoring
- Configuration management
- Audit logging

</td>
</tr>
</table>

### 🎯 Additional Features

- **🔗 Dependency Visualization** - Interactive graph visualization of service relationships and dependencies
- **📈 Operational Insights** - Real-time service health, performance metrics, and lifecycle tracking
- **⭐ Resource Management** - Star, filter, and organize important infrastructure components
- **🔐 Enterprise Security** - Multi-account support with AES-256 encryption for credentials
- **📱 Responsive Design** - Mobile-friendly interface for on-the-go access
- **🔄 Real-time Updates** - Automatic synchronization with GitHub and AWS
- **📝 Service Checklists** - Customizable deployment and readiness checklists
- **🏷️ Smart Tagging** - Automatic and manual tagging for better organization

## 🏗️ Architecture

Guardian Platform follows a modern, scalable architecture:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js 15    │     │  GitHub API     │     │    AWS APIs     │
│   Frontend      │────▶│  Integration    │────▶│   Multi-Account │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   API Routes    │     │  Service        │     │   Resource      │
│   (App Router)  │────▶│  Discovery      │────▶│   Discovery     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  PostgreSQL     │     │  LlamaIndex     │     │   pgvector      │
│   Database      │────▶│  Cloud API      │────▶│  Embeddings     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

For detailed architecture documentation, see [Architecture Guide](docs/ARCHITECTURE.md).

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Description |
|-------------|---------|-------------|
| Node.js | 20+ | JavaScript runtime |
| PostgreSQL | 15+ | Database with pgvector extension |
| Docker | 20.10+ | Container runtime (optional) |
| Git | 2.30+ | Version control |

### Required Services

1. **GitHub App** - For repository access ([Setup Guide](#github-app-setup))
2. **AWS IAM Credentials** - For cloud resource discovery (optional)
3. **LlamaIndex Cloud** - For AI-powered chat features
4. **OpenAI API** - For LLM capabilities

## 🚀 Quick Start

### 💻 Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-org/guardian-platform.git
cd guardian-platform

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration (see Configuration section)

# 4. Set up the database
npm run db:generate
npm run db:migrate

# 5. Start the development server
npm run dev

# 6. Open http://localhost:3000
```

### 🐳 Docker Compose

```bash
# 1. Clone and navigate
git clone https://github.com/your-org/guardian-platform.git
cd guardian-platform

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# 3. Start all services
docker compose up --build

# 4. Open http://localhost:3000
```

Docker Compose includes:
- Guardian Platform application
- PostgreSQL with pgvector extension
- Automatic database migrations

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@localhost/guardian` |
| `GITHUB_APP_ID` | ✅ | GitHub App ID | `123456` |
| `GITHUB_APP_PRIVATE_KEY` | ✅ | GitHub App private key (base64) | `LS0tLS1CRUdJTi...` |
| `GITHUB_APP_INSTALLATION_ID` | ✅ | GitHub App installation ID | `12345678` |
| `GITHUB_ORG` | ✅ | GitHub organization name | `your-org` |
| `AWS_CREDENTIALS_ENCRYPTION_KEY` | ✅ | 32-byte key for encryption | Generate with `openssl rand -base64 32` |
| `LLAMA_API_KEY` | ✅ | LlamaIndex Cloud API key | `lix_...` |
| `LLM_API_KEY` | ✅ | OpenAI API key | `sk-...` |
| `NEXTAUTH_SECRET` | ⚠️ | NextAuth secret (production) | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ⚠️ | Application URL (production) | `https://guardian.example.com` |

### GitHub App Setup

1. **Create a GitHub App**
   ```
   Settings → Developer settings → GitHub Apps → New GitHub App
   ```

2. **Configure permissions**:
   - Repository permissions:
     - Contents: Read
     - Metadata: Read
   - Organization permissions:
     - Members: Read

3. **Generate and download private key**

4. **Install the app on your organization**

For detailed setup instructions, see [GitHub App Setup Guide](docs/README.md#github-app-setup).

### AWS Configuration (Optional)

To enable AWS resource discovery:

1. **Create an IAM user** with the following policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ec2:Describe*",
           "rds:Describe*",
           "s3:ListAllMyBuckets",
           "s3:GetBucketLocation",
           "lambda:List*",
           "ecs:Describe*",
           "ecs:List*",
           "elasticloadbalancing:Describe*",
           "cloudwatch:Describe*",
           "tag:GetResources"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

2. **Add AWS credentials** through the Admin Dashboard

## 📝 Service Discovery Setup

Guardian automatically discovers services through YAML manifests in your repositories.

### Quick Setup

1. **Create `.guardian` folder** in your repository root:
   ```bash
   mkdir .guardian
   ```

2. **Add service manifest** (e.g., `.guardian/my-service.yml`):
   ```yaml
   kind: Service
   metadata:
     name: my-api-service
     displayName: "My API Service"
     description: "Core API service for user management"
   
   spec:
     owner:
       team: platform-team
       email: platform@example.com
     
     lifecycle: production  # development|beta|production|deprecated|retired
     tier: tier1           # tier1-4 (criticality)
     type: api            # api|frontend|worker|cronjob|database|library
     
     techStack:
       - "Language: Node.js"
       - "Framework: Express"
       - "Database: PostgreSQL"
     
     links:
       - name: "API Docs"
         url: "https://api.example.com/docs"
       - name: "Monitoring"
         url: "https://grafana.example.com/dashboard/my-api"
   ```

3. **Commit and push** - Guardian will automatically discover your service!

For complete manifest documentation, see [Service Manifest Guide](docs/README-manifest.md).

## 📦 Deployment

### Production Deployment

Guardian Platform can be deployed to various platforms:

- **[Vercel](docs/DEPLOYMENT.md#vercel)** - Recommended for Next.js applications
- **[AWS ECS](docs/DEPLOYMENT.md#aws-ecs)** - Container-based deployment
- **[Kubernetes](docs/DEPLOYMENT.md#kubernetes)** - For large-scale deployments
- **[Docker Swarm](docs/DEPLOYMENT.md#docker-swarm)** - Simple container orchestration

See the [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

### Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure production database with backups
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting
- [ ] Enable HTTPS/TLS
- [ ] Set up log aggregation
- [ ] Configure CI/CD pipeline
- [ ] Set up error tracking (e.g., Sentry)

## 📚 API Reference

Guardian Platform provides RESTful APIs for integration:

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/services` | GET | List all services |
| `/api/services/[id]` | GET | Get service details |
| `/api/aws/resources` | GET | List AWS resources |
| `/api/chat` | POST | Chat with documentation |
| `/api/catalog/ingestion/trigger` | POST | Trigger service discovery |

For complete API documentation, see [API Reference](docs/API.md).

## 🛠️ Development

### Project Structure

```
guardian-platform/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── services/         # Business logic
│   ├── db/              # Database schema
│   └── utils/           # Utilities
├── docs/                # Documentation
├── drizzle/            # Database migrations
└── public/             # Static assets
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Drizzle Studio
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 🔧 Troubleshooting

### Common Issues

<details>
<summary><strong>Database connection errors</strong></summary>

- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure pgvector extension is installed:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
</details>

<details>
<summary><strong>GitHub App authentication failures</strong></summary>

- Verify App ID and Installation ID
- Check private key format (should be base64 encoded)
- Ensure app has correct permissions
</details>

<details>
<summary><strong>AWS discovery not working</strong></summary>

- Check IAM permissions
- Verify credentials encryption key
- Check AWS region settings
</details>

For more solutions, see [Troubleshooting Guide](docs/TROUBLESHOOTING.md).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow [TypeScript best practices](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🔒 Security

Security is a top priority. Please review our [Security Policy](SECURITY.md).

### Reporting Vulnerabilities

- **DO NOT** open public issues for security vulnerabilities
- Email security@example.com with details
- We aim to respond within 48 hours

### Security Features

- AES-256 encryption for sensitive data
- Role-based access control
- Audit logging for all actions
- Regular dependency updates

## 💬 Support

### Getting Help

- 📖 [Documentation](docs/)
- 💬 [GitHub Discussions](https://github.com/your-org/guardian-platform/discussions)
- 🐛 [Issue Tracker](https://github.com/your-org/guardian-platform/issues)
- 📧 Email: support@example.com

### Community

- [Discord Server](https://discord.gg/guardian)
- [Community Forum](https://forum.guardian.example.com)
- [Twitter/X](https://twitter.com/guardianplatform)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by the Guardian Platform Team
</p>

<p align="center">
  <a href="#-guardian-platform">⬆ Back to top</a>
</p>
