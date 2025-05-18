# Guardian Service Manifest

## Overview

The `guardian-manifest.yaml` file is the primary way to register your service with the Guardian Platform. This file contains essential metadata about your service that enables Guardian to provide visibility, manage readiness checklists, and improve operational awareness.

Each repository that represents a service should include this manifest file at its root.

## Basic Structure

```yaml
kind: Service

metadata:
  name: your-service-name
  displayName: Human Readable Service Name
  description: A brief description of what this service does

spec:
  # Service metadata follows...
```

## Required Fields

| Field | Description |
|-------|-------------|
| `apiVersion` | Always `guardian.io/v1alpha1` for now |
| `kind` | Always `Service` for service manifests |
| `metadata.name` | Unique identifier for your service (lowercase, alphanumeric, hyphens) |
| `spec.owner.team` | Team that owns this service |
| `spec.lifecycle` | Current lifecycle stage of the service |
| `spec.tier` | Criticality tier of the service |

## Complete Example

```yaml
kind: Service

metadata:
  name: payment-processor
  displayName: Payment Processing Service
  description: Handles all payment transactions and integrations with payment providers

spec:
  # Ownership
  owner:
    team: payments-team
    email: payments-team@example.com
  
  # Classification
  lifecycle: production  # Options: development, beta, production, deprecated, retired
  tier: tier1  # Options: tier1 (most critical) to tier4 (least critical)
  
  # Service classification
  type: api  # Options: api, frontend, worker, cronjob, database, library
  
  # Application grouping - links related services together
  partOf: payment-platform
  
  # Dependencies and relationships
  dependencies:
    - name: customer-database
      relationship: requires
      critical: true
    - name: payment-ui
      relationship: serves
    - name: daily-settlement-job
      relationship: triggers
  
  # Technical stack
  techStack:
    - Java
    - Spring Boot
    - PostgreSQL
  
  # Important links
  links:
    - name: API Documentation
      url: https://docs.example.com/payment-api
    - name: Dashboard
      url: https://grafana.example.com/d/payment-service
    - name: Repository
      url: https://github.com/example/payment-processor
  
  # Default checklist template to use for this service
  defaultChecklistTemplateId: payment-service-checklist

  # For cron jobs only - omit for other service types
  schedule: "0 0 * * *"  # Cron expression for when the job runs
```

## Field Reference

### Metadata Section

| Field | Required | Description |
|-------|----------|-------------|
| `metadata.name` | Yes | Unique identifier for your service |
| `metadata.displayName` | No | Human-readable name for your service |
| `metadata.description` | No | Brief description of what the service does |

### Spec Section

#### Owner
```yaml
owner:
  team: team-name      # Required: Team that owns the service
  email: team@example.com # Optional: Contact email
```

#### Classification
```yaml
lifecycle: production  # Required: development, beta, production, deprecated, retired
tier: tier2           # Required: tier1 (critical) to tier4 (low impact)
```

#### Service Type and Grouping
```yaml
type: api             # Optional: api, frontend, worker, cronjob, database, library
partOf: platform-name # Optional: Used to group related services
```

#### Dependencies
```yaml
dependencies:
  - name: other-service-name   # Required: Name of the dependency
    relationship: requires     # Optional: requires, serves, triggers, etc.
    critical: true            # Optional: Is this a critical dependency?
```

#### Technical Stack
```yaml
techStack:            # Optional: List of technologies used
  - JavaScript
  - React
  - MongoDB
```

#### Links
```yaml
links:                # Optional: Important links related to the service
  - name: Documentation
    url: https://docs.example.com/service
  - name: Dashboard
    url: https://grafana.example.com/d/service
```

#### Default Checklist Template
```yaml
defaultChecklistTemplateId: template-id  # Optional: Used for service readiness checklists
```

#### Cron Job Scheduling (for services of type "cronjob")
```yaml
schedule: "0 0 * * *"  # Optional: Cron expression for scheduled jobs
```

## Version History

- v1alpha1: Initial version

## Need Help?

For questions or help with your Guardian manifest, please contact the platform team. 
