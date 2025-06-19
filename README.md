# Guardian Platform

A comprehensive infrastructure and service discovery platform that provides centralized visibility into your organization's services and cloud resources.

## Todo

- [ ] Log handler
- [X] Handle multiple AWS accounts
- [ ] Move to tanstack query and tanstack table
- [ ] Deployment checklist automation
- [ ] Authentication setup (org level)
- [ ] Monitoring from the given url (if in the service)

## Core Features

- **Service Discovery**: Automatically catalog services through owner-defined YAML manifests
- **Documentation Chat**: AI-powered conversations with service documentation using LlamaIndex
- **Dependency Visualization**: Interactive graphs showing service relationships and dependencies  
- **AWS Resource Discovery**: Automated discovery and tracking of cloud infrastructure
- **Operational Awareness**: Centralized dashboard for service lifecycle, ownership, and health

This foundation supports better operational decision-making and establishes the groundwork for comprehensive service readiness management.

## Tech Stack

**Frontend**
- **Next.js 15** with App Router and React 19
- **Mantine UI** for modern React components
- **TypeScript** for type-safe development

**Backend & Database**
- **PostgreSQL** with pgvector for vector similarity search
- **Drizzle ORM** for type-safe database operations
- **Multi-table schema** with proper foreign key relationships

**Cloud Integration**
- **AWS SDK v3** with support for multiple service clients
- **Resource Groups Tagging API** for comprehensive resource discovery
- **Multi-account credential management** with AES-256 encryption

**AI & Search**
- LlamaIndex - Document indexing and intelligent retrieval
- pgvector - Vector similarity search for semantic document matching
- OpenAI Integration - Language model capabilities

**Development**
- ESLint - Code linting and formatting
- Turbopack - Fast bundler for development

## Quick Setup

### Local Development

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd guardian-nextjs
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   Fill in required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID` - GitHub App credentials
   - `AWS_CREDENTIALS_ENCRYPTION_KEY` - Generate with `openssl rand -base64 32`
   - `LLAMA_API_KEY` - LlamaIndex Cloud API key
   - `LLM_API_KEY` - OpenAI or LLM provider API key
   - `EMBEDDING_API_KEY` - Embedding model API key

3. **Database migrations**
   ```bash
   npm run db:migrate
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

### Docker Compose

```bash
docker compose up --build
```


### Setup Notes
- **GitHub App**: Create with repository read permissions and webhook URL
- **AWS**: Use read-only IAM credentials for resource discovery
- **Prerequisites**: PostgreSQL with pgvector extension, Node.js 20+

Detailed setup instructions available in [docs/README.md](docs/README.md)

## Interesting New Thing

### Parallel Routes + Intercepting Routes for Seamless Modal Experience

Combined Next.js Parallel Routes (`@chat` slot) with Intercepting Routes (`(...)chat`) to create URL-driven modals that work as both overlays and shareable full pages. Click "Chat with Docs" from service cards opens a modal, while direct `/chat` navigation loads the full page - all without traditional state management.
