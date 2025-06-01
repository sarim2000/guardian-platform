export const SERVICE_MANIFEST_EXAMPLE = `kind: Service
metadata:
  # --- Required ---
  name: node-service # Unique identifier for this service (e.g., kebab-case)

  # --- Optional ---
  displayName: "Node Service" # Human-readable name for UIs
  description: "Manages the routing of requests to the appropriate service."
  annotations: # For custom metadata, operational notes, etc.
    last-reviewed-by: "sarim@arohalabs.com"
    review-date: "2025-05-18"
spec:
  # --- Required ---
  owner:
    team: mira-network # Team slug or ID responsible for this service
    email: sarim@arohalabs.com # Optional: Contact email for the team

  lifecycle: production # Current stage: e.g., development, beta, production, deprecated, retired
  
  # --- Optional ---
  tier: tier1 # Criticality: e.g., tier1 (most critical) to tier4 (least critical)
  type: api # Nature of the service: e.g., api, frontend, worker, cronjob, database, library
  partOf: mira-network # Logical grouping: name of a larger system/platform

  techStack: # List of key technologies used
    - "Language: Nodejs"
    - "Framework: Fastify"
    - "Database Client: Postgres"
    - "Cache: Redis"

  links: # Important URLs related to the service
    - name: "Source Code (GitLab)"
      url: "https://gitlab.example.com/alpha-squad/user-profile-api"
    - name: "API Documentation (Swagger UI)"
      url: "https://api.example.com/user-profile/docs"
    - name: "Primary Dashboard (Grafana)"
      url: "https://grafana.example.com/d/user-profile-api-overview"
    - name: "Runbook (Confluence)"
      url: "https://confluence.example.com/display/ENG/UserProfileAPI+Runbook"

  # ID of a ChecklistTemplate defined in Guardian.
  # The Guardian platform will use this to associate readiness checks.
  # defaultChecklistTemplateId: "standard-api-prod-checklist-v1"`

export const FILE_STRUCTURE_EXAMPLE = [
  {
    name: '.guardian',
    type: 'folder' as const,
    children: [
      { name: 'api-service.yml', type: 'file' as const },
      { name: 'worker-service.yml', type: 'file' as const },
      { name: 'notification-service.yml', type: 'file' as const }
    ]
  }
] 
