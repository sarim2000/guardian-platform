# 🛡️ Guardian Platform

<p align="center">
  <img src="docs/images/home.png" alt="Guardian Platform Dashboard" width="600"/>
</p>

<p align="center">
  <strong>A comprehensive infrastructure and service discovery platform that provides centralized visibility into your organization's services and cloud resources.</strong>
</p>

<p align="center">
  <a href="#-quick-setup">🚀 Quick Start</a> •
  <a href="docs/README.md">📖 Setup Guide</a> •
  <a href="#-core-features">✨ Features</a> •
  <a href="#-tech-stack">🔧 Tech Stack</a>
</p>

## Todo

- [ ] Log handler
- [X] Handle multiple AWS accounts
- [ ] Move to tanstack query and tanstack table
- [ ] Deployment checklist automation
- [ ] Authentication setup (org level)
- [ ] Monitoring from the given url (if in the service)

## ✨ Core Features

<table>
<tr>
<td width="50%">

### 🔍 Service Discovery
Automatically catalog services through owner-defined YAML manifests with comprehensive metadata tracking.

<img src="docs/images/services.png" alt="Service Discovery" width="100%"/>

</td>
<td width="50%">

### ☁️ AWS Resource Discovery  
Automated discovery and tracking of cloud infrastructure across multiple AWS accounts.

<img src="docs/images/aws-resources.png" alt="AWS Resources" width="100%"/>

</td>
</tr>
<tr>
<td width="50%">

### 💬 Documentation Chat
AI-powered conversations with service documentation using LlamaIndex for intelligent retrieval.

<img src="docs/images/chat.png" alt="Documentation Chat" width="100%"/>

</td>
<td width="50%">

### 📊 Admin Dashboard
Centralized control panel for managing the platform, users, and system configuration.

<img src="docs/images/admin.png" alt="Admin Dashboard" width="100%"/>

</td>
</tr>
</table>

**Additional Features:**
- 🔗 **Dependency Visualization** - Interactive graphs showing service relationships
- 📈 **Operational Awareness** - Service lifecycle, ownership, and health tracking
- ⭐ **Resource Starring** - Favorite and filter important infrastructure components
- 🔒 **Multi-Account Support** - Secure credential management with AES-256 encryption

This foundation supports better operational decision-making and establishes the groundwork for comprehensive service readiness management.

## 🔧 Tech Stack

<table>
<tr>
<td>

**🎨 Frontend**
- Next.js 15 with App Router
- React 19 + TypeScript
- Mantine UI Components
- Parallel & Intercepting Routes

</td>
<td>

**🗄️ Backend & Database**
- PostgreSQL + pgvector
- Drizzle ORM
- Multi-table schema design
- Foreign key relationships

</td>
</tr>
<tr>
<td>

**☁️ Cloud Integration**
- AWS SDK v3
- Resource Groups Tagging API
- Multi-account management
- AES-256 credential encryption

</td>
<td>

**🤖 AI & Search**
- LlamaIndex Cloud
- pgvector similarity search
- OpenAI Integration
- Semantic document matching

</td>
</tr>
</table>

## 🚀 Quick Setup

### 💻 Local Development

```bash
# 1. Clone and navigate
git clone <repository-url>
cd guardian-nextjs

# 2. Environment setup
cp .env.example .env.local
# Fill in required variables (see below)

# 3. Database setup
npm run db:migrate

# 4. Install and run
npm install
npm run dev
```

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `GITHUB_APP_*` - GitHub App credentials ([setup guide](docs/README.md))
- `AWS_CREDENTIALS_ENCRYPTION_KEY` - Generate with `openssl rand -base64 32`
- `LLAMA_API_KEY` - LlamaIndex Cloud API key
- `LLM_API_KEY` - OpenAI or LLM provider API key

### 🐳 Docker Compose

```bash
docker compose up --build
```

Includes PostgreSQL with pgvector and handles environment variables from `.env.local`.

### 📋 Prerequisites
- Node.js 20+
- PostgreSQL with pgvector extension
- GitHub App with repository read permissions
- AWS IAM credentials (read-only)

> 📖 **Need help?** Check out the [detailed setup guide](docs/README.md) for GitHub App creation, AWS configuration, and troubleshooting.

## Interesting New Thing

### Parallel Routes + Intercepting Routes for Seamless Modal Experience

Combined Next.js Parallel Routes (`@chat` slot) with Intercepting Routes (`(...)chat`) to create URL-driven modals that work as both overlays and shareable full pages. Click "Chat with Docs" from service cards opens a modal, while direct `/chat` navigation loads the full page - all without traditional state management.
