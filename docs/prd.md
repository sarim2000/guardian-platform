# Guardian Platform - Focused Product Requirements Document (MVP 1.0)

## 1. Introduction

Guardian Platform provides centralized visibility into an organization's services and cloud resources. This MVP establishes a foundational catalog by ingesting owner-defined service manifests and discovering key AWS resources, enabling better operational awareness and laying the groundwork for future readiness management.

## 2. Goals & Objectives (MVP 1.0)

### Primary Goal
Create a unified, queryable inventory of software services and key cloud assets.

### Objectives
- Implement a manifest-driven service catalog (guardian-manifest.yaml) populated from Git
- Implement a mechanism for defining and managing "System" entities (e.g., product lines, major services) within Guardian, to which individual services can belong
- Implement a discovery mechanism to list a predefined set of AWS resources from a configured account
- Provide a basic API and UI to view and filter this combined inventory
- Validate the core technical approach for both manifest ingestion and AWS discovery

## 3. Target Users (MVP 1.0)

### Platform Administrators/Engineers
- Configure Guardian, manage System definitions, trigger ingestion/discovery, view overall inventory

### Service Owners/Developers  
- Author and maintain guardian-manifest.yaml for their services
- View their services and related AWS resources within Guardian

## 4. Core Features (MVP 1.0)

### 4.1. Manifest-Driven Service Catalog

#### guardian-manifest.yaml Specification
- A defined YAML schema including:
  - manifestSchemaVersion
  - kind: Service
  - metadata.name
  - metadata.owner
  - metadata.partOfSystem
  - optional spec for links, contacts, observability hints, default checklist ID
  - (Refer to guardian_manifest_spec.md for full details)

#### Manifest Ingestion
- Backend service to scan configured Git repositories for guardian-manifest.yaml files
- Parse, validate, and store manifest data (key fields indexed, full manifest as JSONB/TEXT) in PostgreSQL (catalog_entities table)
- Manual trigger for ingestion process via API

#### System Entity Management
- Guardian UI for Platform Administrators to create, view, edit, and delete "System" entities (e.g., mira-network)
- Systems have a unique identifier (referenced by metadata.partOfSystem in service manifests), display name, owner, and description. Stored in a systems table in PostgreSQL
- Ingestion process links services to Systems via metadata.partOfSystem matching a System's unique identifier

### 4.2. AWS Resource Discovery & Listing

#### AWS Integration (Read-Only)
- Guardian backend securely uses AWS credentials (from environment variables) and a configured AWS region
- Associated IAM User/Role uses ReadOnlyAccess policy (for PoC in isolated dev/sandbox; least-privilege custom policy mandatory post-PoC)

#### Resource Discovery
- Manually triggered backend process to scan for a predefined set of AWS resource types (MVP scope: EC2 Instances, S3 Buckets, Lambda Functions)
- Extracts key metadata (ARN, Name tag, type, region, key tags, raw AWS metadata)

#### Data Storage
- Discovered AWS resource metadata stored in a dedicated PostgreSQL table (aws_discovered_resources)
- Upsert logic based on ARN

### 4.3. Unified Catalog API & UI

#### API Endpoints
- POST /api/catalog/ingestion/trigger: Initiates manifest ingestion
- POST /api/aws/discovery/trigger: Initiates AWS resource discovery
- GET /api/systems: Lists all defined System entities
- GET /api/systems/{systemIdentifier}/services: Lists manifest-defined services belonging to a System
- GET /api/services: Lists all manifest-defined services with filtering (owner, system, tags) and pagination
- GET /api/services/{serviceName}: Details for one manifest-defined service
- GET /api/aws/resources: Lists discovered AWS resources with filtering (type, region, tags) and pagination

#### UI Views
- Admin section: Trigger ingestion/discovery; manage System entities
- Hierarchical view: List Systems, expand to see their constituent manifest-defined services
- Global service list: All manifest-defined services, filterable
- Service detail page: Displays all information from its guardian-manifest.yaml
- AWS discovered resources list: Filterable table of discovered AWS assets

## 5. Success Metrics (MVP 1.0)

### Manifest Catalog
- ≥ 10 distinct services successfully onboarded via guardian-manifest.yaml by pilot teams
- ≥ 3 "System" entities defined, each with ≥ 2 linked services
- Users can successfully filter services by owner and system

### AWS Discovery
- Guardian successfully lists EC2, S3, and Lambda resources from one configured AWS account/region
- Key metadata (ID, Name, Type, Region, Tags) for discovered AWS resources is accurately displayed

### Platform
- Core API endpoints for catalog and AWS resource retrieval are functional and performant (<500ms P90)
- Ingestion/discovery processes complete successfully for PoC-scale data

### User Feedback (Qualitative)
- Positive feedback from service owners on ease of creating/understanding guardian-manifest.yaml
- Positive feedback from administrators on defining Systems and viewing the combined inventory

## 6. Key Non-Functional Requirements (MVP Focus)

- Data Integrity: Unique constraints enforced for service names and system identifiers. Manifest validation errors are logged
- Security: AWS credentials handled securely. Read-only access to AWS
- Usability: UI is intuitive for core tasks (viewing catalog, triggering syncs, managing systems)
- Maintainability: Backend code (Next.js, Drizzle) is well-structured. Database schema uses migrations

## 7. Out of Scope for MVP 1.0

- Readiness checklist functionality (creation, execution, tracking)
- Release management features
- User authentication & granular RBAC for Guardian UI/API (MVP assumes trusted admin users or basic protection for trigger APIs)
- Automated/scheduled ingestion or discovery runs
- Advanced analytics, AI features, notifications
- UI for creating/editing guardian-manifest.yaml (users edit YAML directly)
- Direct linking/reconciliation between AWS discovered resources and manifest-defined services (beyond manual comparison by users)
- Modifying AWS resources from Guardian
- Support for Git providers other than the initial one
- Support for AWS services beyond the initially defined PoC set (EC2, S3, Lambda)
