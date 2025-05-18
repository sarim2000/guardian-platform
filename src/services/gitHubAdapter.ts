// services/gitHubAdapter.ts

import { Octokit } from '@octokit/rest'; // Or just 'octokit' if you installed the umbrella package
import yaml from 'js-yaml'; // For parsing the root manifest in the example

// Interface for basic repo info, align with your IGitProviderAdapter definition
export interface BasicRepoInfo {
  name: string;
  fullName: string; // e.g., "organization/repo-name"
  externalId: string; // GitHub's repo ID (number, but string for consistency)
  defaultBranch: string;
  private: boolean;
  archived: boolean;
  updatedAt: string; // ISO 8601 string
}

// Your IGitProviderAdapter interface (ensure this matches your definition in the TODO)
export interface IGitProviderAdapter {
  listRepositories(): Promise<BasicRepoInfo[]>; // Removed organization: string, as it's part of the constructor
  getFileContent(
    repoName: string, // Changed from organization: string, repoName: string
    filePath: string,
    ref?: string // Optional: branch, tag, or commit SHA
  ): Promise<string | null>;
}

// Structure for the root monorepo configuration file
interface GuardianRepositoryMap {
  apiVersion: string;
  kind: string;
  metadata?: {
    name?: string;
  };
  spec: {
    serviceManifests: Array<{ path: string }>;
  };
}


export class GitHubAdapter implements IGitProviderAdapter {
  private octokit: Octokit;
  private organizationName: string;

  constructor(pat: string, organizationName: string) {
    if (!pat) {
      throw new Error('GitHub PAT is required for GitHubAdapter.');
    }
    if (!organizationName) {
      throw new Error('GitHub organization name is required for GitHubAdapter.');
    }
    this.octokit = new Octokit({ auth: pat });
    this.organizationName = organizationName;
  }

  /**
   * Lists all non-archived repositories for the configured organization.
   * Handles pagination automatically by Octokit's paginate method.
   */
  async listRepositories(): Promise<BasicRepoInfo[]> {
    try {
      const repos = await this.octokit.paginate(this.octokit.repos.listForOrg, {
        org: this.organizationName,
        type: 'all',
        per_page: 100,
      });

      const activeRepos = repos.filter(repo => !repo.archived);

      return activeRepos.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        externalId: repo.id.toString(),
        defaultBranch: repo.default_branch || '',
        private: repo.private,
        archived: repo.archived || false,
        updatedAt: repo.updated_at || new Date().toISOString(),
      }));
    } catch (error: any) {
      throw new Error(`GitHub API Error in listRepositories: ${error.message}`);
    }
  }

  /**
   * Fetches the content of a specific file from a repository within the configured organization.
   * @param repoName The name of the repository (without the organization part).
   * @param filePath The path to the file within the repository.
   * @param ref Optional branch, tag, or commit SHA. Defaults to the repo's default branch if not provided.
   * @returns The file content as a string, or null if the file is not found or an error occurs.
   */
  async getFileContent(
    repoName: string,
    filePath: string,
    ref?: string
  ): Promise<string | null> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.organizationName,
        repo: repoName,
        path: filePath,
        ref: ref,
      });

      if (Array.isArray(response.data) || !('content' in response.data) || !response.data.content) {
        return null;
      }

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return content;

    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      return null;
    }
  }
}

// Example Usage (illustrating Strategy C for monorepos)
// This logic would typically reside in your ManifestIngestionService.
async function exampleMonorepoIngestionLogic(githubAdapter: GitHubAdapter, repo: BasicRepoInfo) {
  const MONOREPO_CONFIG_FILENAME = 'guardian-repository.yaml'; // Or your chosen name
  const STANDARD_MANIFEST_FILENAME = 'guardian-manifest.yaml';
  let manifestsToProcess: Array<{ repoName: string, filePath: string, content: string }> = [];

  // Strategy C: Try to fetch the monorepo root configuration file first
  const monorepoConfigContent = await githubAdapter.getFileContent(
    repo.name,
    MONOREPO_CONFIG_FILENAME
  );

  if (monorepoConfigContent) {
    try {
      const parsedConfig = yaml.load(monorepoConfigContent) as GuardianRepositoryMap; // Type assertion
      if (parsedConfig && parsedConfig.spec && parsedConfig.spec.serviceManifests) {
        for (const manifestEntry of parsedConfig.spec.serviceManifests) {
          if (manifestEntry.path) { 
            const subManifestContent = await githubAdapter.getFileContent(
              repo.name,
              manifestEntry.path
            );
            if (subManifestContent) {
              manifestsToProcess.push({
                repoName: repo.name,
                filePath: manifestEntry.path,
                content: subManifestContent
              });
            } else {
              console.warn(`Could not fetch sub-manifest: ${manifestEntry.path} from ${repo.fullName}`);
            }
          }
        }
      } else {
        console.warn(`Invalid or empty ${MONOREPO_CONFIG_FILENAME} structure in ${repo.fullName}.`);
      }
    } catch (e: any) {
      console.error(`Error parsing ${MONOREPO_CONFIG_FILENAME} from ${repo.fullName}: ${e.message}`);
    }
  } else {
    // Fallback: If no monorepo config, try fetching a standard manifest at the root
    console.info(`No ${MONOREPO_CONFIG_FILENAME} found in ${repo.fullName}. Checking for root ${STANDARD_MANIFEST_FILENAME}.`);
    const rootManifestContent = await githubAdapter.getFileContent(
      repo.name,
      STANDARD_MANIFEST_FILENAME
    );
    if (rootManifestContent) {
      console.info(`Found root ${STANDARD_MANIFEST_FILENAME} in ${repo.fullName}`);
      manifestsToProcess.push({
        repoName: repo.name,
        filePath: STANDARD_MANIFEST_FILENAME,
        content: rootManifestContent
      });
    } else {
      console.warn(`No manifest files found (neither ${MONOREPO_CONFIG_FILENAME} nor root ${STANDARD_MANIFEST_FILENAME}) in ${repo.fullName}`);
    }
  }

  // Now, `manifestsToProcess` array contains all manifest contents to be parsed and stored.
  // Your actual Ingestion Service would take these and update the database.
  if (manifestsToProcess.length > 0) {
    console.info(`Found ${manifestsToProcess.length} manifest(s) to process for repo ${repo.fullName}:`);
    manifestsToProcess.forEach(m => {
      console.info(`  - Path: ${m.filePath}, Content snippet: ${m.content.substring(0, 70).replace(/\n/g, ' ')}...`);
      // Here you would call your YAML parsing and database upsert logic
    });
  }
}


async function mainExample() {
  const pat = process.env.GIT_PROVIDER_PAT;
  const orgName = process.env.GIT_PROVIDER_ORGANIZATION_NAME;

  if (!pat || !orgName) {
    console.error("Missing GIT_PROVIDER_PAT or GIT_PROVIDER_ORGANIZATION_NAME in environment variables.");
    return;
  }

  const githubAdapter = new GitHubAdapter(pat, orgName);

  try {
    const repos = await githubAdapter.listRepositories();
    console.info(`Found ${repos.length} total repositories in ${orgName}.`);

    for (const repo of repos) {
      // Simulate processing for each repo using the monorepo logic
      await exampleMonorepoIngestionLogic(githubAdapter, repo);
      console.info('-----------------------------------------------------');
    }

  } catch (error) {
    console.error("Error during main example execution:", error);
  }
}

// To run this example:
// 1. Ensure you have GIT_PROVIDER_PAT and GIT_PROVIDER_ORGANIZATION_NAME in your .env file
// 2. You might need to install js-yaml: npm install js-yaml @types/js-yaml
// 3. Uncomment and run:
// mainExample();
