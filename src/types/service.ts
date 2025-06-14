// Service link interface
export interface ServiceLink {
  name: string;
  url: string;
}

// Service interface for frontend
export interface Service {
  id: string;
  serviceName: string;
  displayName?: string;
  description?: string;
  ownerTeam: string;
  lifecycle: string;
  tier?: string;
  serviceType?: string;
  partOf?: string;
  organizationName: string;
  repositoryName: string;
  manifestPath: string;
  links?: ServiceLink[];
  techStack?: string[];
  dependencies?: Array<{
    name: string;
    critical: boolean;
    relationship: string;
  }>;
} 
