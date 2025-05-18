# Guardian Service Catalog Project Plan

## Core Principle
Build a robust, extensible foundation. Prioritize code quality, data model integrity, and API design for future iteration, avoiding temporary solutions. The service catalog will be primarily driven by guardian-manifest.yaml files in Git repositories.

## Phase 1: Core Backend Foundation & Data Definition
**Goal**: Establish the project, define data structures, and set up the database.

### I. Project Setup & Core Backend (Next.js, TypeScript, PostgreSQL)
#### Initialize Project:
- [x] Setup Next.js project with TypeScript
- [x] Install and configure ESLint, Prettier for code quality
- [x] Setup PostgreSQL database (local instance for dev)

#### Configuration Management:
- [x] Setup mechanism for managing environment variables (.env)
- [x] Define initial environment variables (POSTGRES_URL, LOG_LEVEL)

#### Basic Logging:
- [ ] Integrate a structured logging library (e.g., Pino) for backend services

#### Error Handling Framework:
- [ ] Define a basic framework for consistent backend error handling

### II. Guardian Entity YAML Definitions & Schema (v1alpha1)
- [ ] Formally Document Service Kind YAML Structure (as detailed in previous TODO)
- [ ] Acknowledge ChecklistTemplate Kind exists (for defaultChecklistTemplateId reference)
- [ ] Create example guardian-manifest.yaml files for testing
- [ ] Decide on the canonical path for the manifest file (e.g., guardian-manifest.yaml at root)

### III. Database Design & Implementation (PostgreSQL)
- [X] Choose and integrate ORM (e.g., Drizzle or Prisma)
- [X] Define services Table Schema (as detailed, aligning with Service YAML)
  - Note: Consider adding checklist_templates table schema now, even if full functionality is vNext, to ensure default_checklist_template_id can eventually be a true foreign key
- [X] Setup database migration tool
- [X] Create initial migration for the services table (and checklist_templates if designed)
- [X] Configure database connection pooling

## Phase 2: Backend - Git Integration & Data Ingestion Pipeline
**Goal**: Implement the mechanism to fetch, parse, and store service manifests from Git.

### II. Guardian Entity YAML Definitions & Schema (Continued)
- [ ] Choose and integrate YAML parsing library (e.g., js-yaml)
- [ ] Implement schema validation logic for parsed Service manifest data (e.g., using Zod with the parser)

### IV. Git Provider Integration Service (Backend)
- [ ] Define environment variables for Git integration (GIT_PROVIDER_PAT, GIT_PROVIDER_ORGANIZATION_NAME, GIT_PROVIDER_TYPE)
- [ ] Secure PAT Handling: Ensure PAT is loaded securely
- [ ] Design Extensible Git Service Interface (IGitProviderAdapter)
- [ ] Implement GitHub Adapter (or chosen first provider) for listRepositories and getFileContent

### V. Service Catalog Core Logic & Ingestion (Backend)
- [ ] Create Manifest Ingestion Service module
- [ ] Implement Step 1: Fetch Repositories
- [ ] Implement Step 2: Process Each Repository (fetch manifest, parse, validate, transform, upsert to services table)
- [ ] Implement overall status reporting/logging for the ingestion job

## Phase 3: Backend - API Endpoint Development
**Goal**: Expose the ingested service data via APIs for the frontend and potentially other clients.

### VI. API Endpoint Development (Backend - Next.js API Routes)
- [ ] Implement POST /api/catalog/ingestion/trigger (secure it, trigger async ingestion)
- [ ] Implement GET /api/services (basic listing, initial pagination)
- [ ] Implement GET /api/services/{id} (retrieve single service)
- [ ] (Backend Testing) Write unit/integration tests for API endpoint handlers
- [ ] (Backend Testing) Manually test all API endpoints using Postman/Insomnia

## Phase 4: Frontend - Basic UI & Admin Interaction
**Goal**: Create a minimal UI to view cataloged services and trigger ingestion.

### VII. Frontend UI Development (Next.js Pages & Components)
- [ ] Setup UI Foundation (component library, layout, basic state management)

#### Admin/System Page:
- [ ] UI button to "Trigger Catalog Ingestion" (calls POST /api/catalog/ingestion/trigger)
- [ ] Display feedback from the trigger action
- [ ] Basic instructions on how to onboard a service

#### Service List Page (/services or /catalog):
- [ ] Fetch and display services from GET /api/services API
- [ ] Show key information (Name, Owner, Lifecycle, Tier)
- [ ] Basic client-side display (pagination can be added later)
- [ ] Link to a Service Detail page

#### Service Detail Page (/services/{id}):
- [ ] Fetch and display detailed information from GET /api/services/{id}
- [ ] Display key manifest fields
- [ ] (Optional) Display raw manifest data
- [ ] Styling & UX: Ensure a clean, usable initial interface

## Phase 5: Feature Completion, Refinement & Comprehensive Testing
**Goal**: Add remaining MVP features, improve existing ones, and ensure quality.

### VI. API Endpoint Development (Backend - Enhancements)
- [ ] Implement advanced filtering and sorting for GET /api/services
- [ ] Implement PATCH /api/services/{id} (if essential for MVP, e.g., for guardian_remarks)

### VII. Frontend UI Development (Enhancements)
- [ ] Implement UI controls for pagination, filtering, and sorting on the Service List Page
- [ ] Refine display of all fields on Service Detail Page (clickable links, formatted dependencies/techStack)
- [ ] Improve overall styling & UX

### VIII. Testing & Quality Assurance
- [ ] Comprehensive Backend Unit/Integration Tests (cover edge cases for parsing, ingestion, API logic)
- [ ] Comprehensive Manual API Testing
- [ ] Frontend Testing: Manual testing of all UI flows, including new filtering/sorting
- [ ] Cross-browser checks
- [ ] End-to-End Testing (Manual for MVP): Test full flow from manifest creation/update in a test repo -> trigger ingestion -> verify UI

## Phase 6: Documentation & Deployment
**Goal**: Prepare the project for users and deploy it.

### IX. Documentation & Deployment
- [ ] README.md Updates: Detailed instructions for setup, manifest creation, development, architecture, API

#### Deployment:
- [ ] Choose and configure deployment platforms (Vercel for Next.js, managed PostgreSQL)
- [ ] Setup CI/CD pipeline (even simple for MVP)
- [ ] Securely manage production environment variables
- [ ] Deploy to a staging environment for final testing
- [ ] Deploy to production

## Phase 7: MVP Review & Future Planning
**Goal**: Launch, gather feedback, and plan for the future.

### X. MVP Review & Next Steps Planning
- [ ] Internal MVP Showcase & Review
- [ ] Gather Feedback
- [ ] Plan Next Iteration (prioritize bugs, improvements, vNext features like the full checklist engine)

---

This chronological approach builds layer by layer, ensuring that dependent pieces have what they need. The backend (data model, ingestion, API) forms the core, and the frontend then visualizes and interacts with that core.
