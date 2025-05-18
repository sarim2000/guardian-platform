# Example 1: ChecklistTemplate YAML (Defined by Platform Admin)
# File: (e.g., in a central config repo) basic-prod-readiness-v1.yaml
# This template is identified by 'metadata.name: basic-prod-readiness-v1'

apiVersion: guardian.io/v1alpha1
kind: ChecklistTemplate
metadata:
  name: basic-prod-readiness-v1 # Unique ID for this checklist template
  displayName: "Basic Production Readiness Checklist v1"
  description: "A foundational checklist for all services targeting production. Ensures essential operational aspects are covered."
  labels:
    category: "general"
    version: "1.0.0"
spec:
  sections:
    - title: "1. Ownership & Documentation"
      description: "Ensures the service is clearly owned and basic documentation is in place."
      items:
        - id: DOC-001
          description: "Owning team is clearly identified in the service manifest."
          severity: critical
          expectedEvidence: "Service manifest `spec.owner.team` is populated."
          responsibleRole: "Engineering Lead / Developer"
        - id: DOC-002
          description: "A basic README.md or runbook exists in the service repository, outlining purpose, setup, and key operational contacts/links."
          severity: high
          expectedEvidence: "Link to the README.md or runbook in the repository."
          responsibleRole: "Developer"

    - title: "2. Monitoring & Logging"
      description: "Verifies that essential monitoring and logging capabilities are implemented."
      items:
        - id: MON-001
          description: "Service emits structured logs for key events (e.g., requests, errors, significant state changes) to a centralized logging system."
          severity: critical
          expectedEvidence: "Link to example log queries or dashboard showing service logs (e.g., Kibana, Splunk, CloudWatch Logs)."
          responsibleRole: "Developer"
        - id: MON-002
          description: "Basic application performance monitoring (APM) is in place, capturing metrics like request rate, error rate, and latency for primary endpoints/functions."
          severity: high
          expectedEvidence: "Link to APM dashboard (e.g., Datadog, New Relic, Prometheus/Grafana)."
          responsibleRole: "Developer / SRE"
        - id: MON-003
          description: "Alerts are configured for critical failure conditions (e.g., high error rate, sustained high latency, service unavailability)."
          severity: critical
          expectedEvidence: "Link to alert definitions or on-call notification setup (e.g., PagerDuty, Opsgenie)."
          responsibleRole: "SRE / Engineering Lead"

    - title: "3. Security Basics"
      description: "Ensures fundamental security practices are followed."
      items:
        - id: SEC-001
          description: "Service dependencies have been scanned for known critical vulnerabilities, and a plan exists to address them."
          severity: critical
          expectedEvidence: "Link to latest dependency scan report (e.g., Snyk, Dependabot, Trivy output)."
          responsibleRole: "Developer / Security Champion"
        - id: SEC-002
          description: "Sensitive configuration (e.g., API keys, passwords) is managed securely (e.g., via a secrets manager) and not hardcoded in the repository."
          severity: critical
          expectedEvidence: "Confirmation of secrets management strategy; no secrets in codebase."
          responsibleRole: "Developer"

    - title: "4. Deployment & Operations"
      description: "Covers basic deployment and operational considerations."
      items:
        - id: OPS-001
          description: "Service has a defined, repeatable deployment process (ideally automated via CI/CD)."
          severity: high
          expectedEvidence: "Link to CI/CD pipeline definition or deployment script/documentation."
          responsibleRole: "Developer / DevOps Engineer"
        - id: OPS-002
          description: "A rollback plan or procedure is documented in case of a failed deployment."
          severity: high
          expectedEvidence: "Link to rollback instructions in the runbook or deployment documentation."
          responsibleRole: "Developer / SRE"

---
# Example 2: Service Manifest YAML (guardian-manifest.yaml - Defined by Developer)
# File: (e.g., at the root of user-profile-api service repository) guardian-manifest.yaml
# This manifest describes the 'user-profile-api' service.

apiVersion: guardian.io/v1alpha1
kind: Service
metadata:
  name: user-profile-api # Unique identifier for this service, defined by the developer
  displayName: "User Profile API"
  description: "Manages user profile data, including personal information, preferences, and activity history."
  annotations:
    last-updated-by: "sarah.developer@example.com"
    last-updated-on: "2025-05-18T10:00:00Z" # Current date/time as an example
spec:
  # Ownership details
  owner:
    team: alpha-squad # Team responsible for the service
    email: alpha-squad-dl@example.com # Contact email for the team

  # Classification of the service
  lifecycle: production # Current lifecycle stage (e.g., development, beta, production)
  tier: tier2 # Criticality tier (e.g., tier1 for most critical, tier4 for least)

  # Service type and grouping
  type: api # Type of service (e.g., api, frontend, worker, cronjob, database)
  partOf: customer-identity-platform # Larger system or platform this service belongs to

  # Dependencies on other services or resources
  dependencies:
    - name: auth-service # Name of the dependent service (should match its metadata.name in Guardian)
      relationship: requires-authentication-from
      critical: true # If true, this dependency is vital for core functionality
    - name: user-activity-db
      relationship: reads-writes-to
      critical: true

  # Technical stack used by the service
  techStack:
    - "Language: Python 3.11"
    - "Framework: FastAPI"
    - "Database Client: SQLAlchemy"
    - "Cache: Redis"

  # Important links related to the service
  links:
    - name: "Source Code (GitLab)"
      url: "https://gitlab.example.com/alpha-squad/user-profile-api"
    - name: "API Documentation (Swagger UI)"
      url: "https://api.example.com/user-profile/docs"
    - name: "Primary Dashboard (Grafana)"
      url: "https://grafana.example.com/d/user-profile-api-overview"
    - name: "Runbook (Confluence)"
      url: "https://confluence.example.com/display/ENG/UserProfileAPI+Runbook"

  # Guardian Platform Integration: Reference to the default checklist template
  # This ID must match the 'metadata.name' of a ChecklistTemplate defined in Guardian.
  defaultChecklistTemplateId: "basic-prod-readiness-v1"

  # Example for a cronjob type service (not applicable here as type is 'api')
  # schedule: "0 3 * * *" # Cron expression if this were a 'cronjob' type
