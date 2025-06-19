# Guardian Platform

A comprehensive infrastructure and service discovery platform that provides centralized visibility into your organization's services and cloud resources.

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


## Interesting New Thing

### Parallel Routes + Intercepting Routes for Seamless Modal Experience

Combined Next.js Parallel Routes (`@chat` slot) with Intercepting Routes (`(...)chat`) to create URL-driven modals that work as both overlays and shareable full pages. Click "Chat with Docs" from service cards opens a modal, while direct `/chat` navigation loads the full page - all without traditional state management.
