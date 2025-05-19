// Basic repository information interface
export interface BasicRepoInfo {
  name: string;
  fullName: string; // e.g., "organization/repo-name"
  externalId: string; // GitHub's repo ID (number, but string for consistency)
  defaultBranch: string;
  private: boolean;
  archived: boolean;
  updatedAt: string; // ISO 8601 string
}

// Git Provider adapter interface
export interface IGitProviderAdapter {
  listRepositories(): Promise<BasicRepoInfo[]>;
  getFileContent(
    repoName: string,
    filePath: string,
    ref?: string // Optional: branch, tag, or commit SHA
  ): Promise<string | null>;
}

// Structure for the root monorepo configuration file
export interface GuardianRepositoryMap {
  apiVersion: string;
  kind: string;
  metadata?: {
    name?: string;
  };
  spec: {
    serviceManifests: Array<{ path: string }>;
  };
}

// Structure for the service manifest file
export interface GuardianManifest {
  kind: string;
  metadata: {
    name: string;
    displayName?: string;
    description?: string;
    annotations?: Record<string, any>;
  };
  spec: {
    owner: {
      team: string;
      email?: string;
    };
    lifecycle: string;
    tier?: string;
    type?: string;
    partOf?: string;
    dependencies?: Array<{
      name: string;
      relationship: string;
      critical: boolean;
    }>;
    techStack?: string[];
    links?: Array<{
      name: string;
      url: string;
    }>;
    defaultChecklistTemplateId?: string;
  };
} 
