# Guardian Platform

## Overview

Guardian Platform provides centralized visibility into an organization's services and cloud resources. The platform enables teams to:

- **Service Discovery**: Automatically catalog services through owner-defined YAML manifests
- **Documentation Chat**: AI-powered conversations with service documentation using LlamaIndex
- **Dependency Visualization**: Interactive graphs showing service relationships and dependencies  
- **AWS Resource Discovery**: Automated discovery and tracking of cloud infrastructure
- **Operational Awareness**: Centralized dashboard for service lifecycle, ownership, and health

This foundation supports better operational decision-making and establishes the groundwork for comprehensive service readiness management.

## Tech Stack

**Frontend & UI**
- Next.js 15 (React 19) - Full-stack React framework with App Router
- Mantine UI - Modern React components and utilities
- TypeScript - Type-safe development

**Backend & Database**
- Drizzle ORM - Type-safe database operations
- PostgreSQL with pgvector - Relational database with vector search capabilities
- AWS SDK - Cloud resource discovery and management

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
