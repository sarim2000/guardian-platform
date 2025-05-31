// services/gitHubAdapter.ts

import { Octokit } from '@octokit/rest';
import yaml from 'js-yaml';
import { services } from '@/db/schema/service';
import { db } from '@/db';
import {
  BasicRepoInfo,
  IGitProviderAdapter,
  GuardianRepositoryMap,
  GuardianManifest
} from '@/types/guardian';

export class GitHubAdapter implements IGitProviderAdapter {
  private octokit: Octokit;
  private organizationName: string;
  private gitProvider: string;

  constructor(pat: string, organizationName: string, gitProvider: string = 'github') {
    if (!pat) {
      console.error('GitHub PAT is required for GitHubAdapter.');
      throw new Error('GitHub PAT is required for GitHubAdapter.');
    }
    if (!organizationName) {
      console.error('GitHub organization name is required for GitHubAdapter.');
      throw new Error('GitHub organization name is required for GitHubAdapter.');
    }
    this.octokit = new Octokit({ auth: pat });
    this.organizationName = organizationName;
    this.gitProvider = gitProvider;
    console.info(`GitHubAdapter initialized for organization: ${this.organizationName}`);
  }

  get provider(): string {
    return this.gitProvider;
  }

  /**
   * Lists repositories for the configured organization that the authenticated PAT has access to.
   * Handles pagination automatically by Octokit's paginate method.
   * GitHub API inherently scopes this to the PAT's permissions within the organization.
   */
  async listRepositories(): Promise<BasicRepoInfo[]> {
    console.info(`Fetching repositories for organization: ${this.organizationName} (scoped by PAT permissions)`);
    try {
      // Use the repos.listForAuthenticatedUser endpoint which works with PAT
      const repos = await this.octokit.paginate(this.octokit.repos.listForAuthenticatedUser, {
        per_page: 100,
        sort: 'updated',
        direction: 'desc',
      });

      // Filter repos for the specified organization
      const orgRepos = repos.filter(repo => {
        const [owner] = repo.full_name.split('/');
        return owner.toLowerCase() === this.organizationName.toLowerCase();
      });

      console.info(`Fetched ${orgRepos.length} repositories for ${this.organizationName}.`);

      // Filter out archived repositories
      const activeRepos = orgRepos.filter(repo => !repo.archived);

      console.info(`Fetched ${activeRepos.length} accessible and active repositories for ${this.organizationName}.`);

      return activeRepos.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        externalId: repo.id.toString(),
        defaultBranch: repo.default_branch || '', // Ensure defaultBranch is not null/undefined
        private: repo.private,
        archived: repo.archived || false,
        updatedAt: repo.updated_at || new Date().toISOString(),
      }));
    } catch (error: any) {
      console.error({
        message: `GitHub API Error in listRepositories for organization ${this.organizationName}`,
        errorDetails: { message: error.message, status: error.status }
      });
      // Depending on how critical this is, you might re-throw or return empty array
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
    // Extract owner from repoName if it contains a slash, otherwise use organizationName
    const owner = repoName.includes('/') ? repoName.split('/')[0] : this.organizationName;
    // Extract actual repo name if it contains a slash
    const actualRepoName = repoName.includes('/') ? repoName.split('/')[1] : repoName;

    console.info(`Fetching file content: ${owner}/${actualRepoName}/${filePath}${ref ? ` (ref: ${ref})` : ''}`);
    try {
      const response = await this.octokit.repos.getContent({
        owner: owner,
        repo: actualRepoName,
        path: filePath,
        ref: ref,
      });

      // Ensure response.data is a file object and has content
      if (Array.isArray(response.data) || !('content' in response.data) || typeof response.data.content !== 'string') {
        console.warn(`Path ${filePath} in ${owner}/${actualRepoName} is a directory, has no content, or content is not a string.`);
        return null;
      }

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      console.debug(`Successfully fetched content for ${filePath} in ${owner}/${actualRepoName}`);
      return content;

    } catch (error: any) {
      if (error.status === 404) {
        console.warn(`File not found: ${filePath} in ${owner}/${actualRepoName}${ref ? ` (ref: ${ref})` : ''}`);
        return null; // File not found is a common case, return null
      }
      // For other errors, log and return null to make ingestion resilient
      console.error({
        message: `Failed to get file content for ${filePath} in ${owner}/${actualRepoName}`,
        errorDetails: { message: error.message, status: error.status }
      });
      return null;
    }
  }
}

export interface IngestionResult {
  repository: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
  services?: string[]; // List of service names that were processed
}

export async function monorepoIngestionLogic(githubAdapter: GitHubAdapter, repo: BasicRepoInfo): Promise<IngestionResult> {
  const MONOREPO_CONFIG_FILENAME = 'guardian-repository.yml';
  const STANDARD_MANIFEST_FILENAME = 'guardian-manifest.yml';
  let manifestsToProcess: Array<{ repoName: string, filePath: string, content: string }> = [];
  const processedServices: string[] = [];

  console.info(`Processing repository: ${repo.fullName}`);

  try {
    const monorepoConfigContent = await githubAdapter.getFileContent(
      repo.fullName,
      MONOREPO_CONFIG_FILENAME
    );

    if (monorepoConfigContent) {
      console.info(`Found ${MONOREPO_CONFIG_FILENAME} in ${repo.fullName}. Parsing for sub-manifests.`);
      try {
        const parsedConfig = yaml.load(monorepoConfigContent) as GuardianRepositoryMap;
        if (parsedConfig && parsedConfig.spec && parsedConfig.spec.serviceManifests) {
          for (const manifestEntry of parsedConfig.spec.serviceManifests) {
            if (manifestEntry.path) {
              console.info(`Fetching sub-manifest: ${manifestEntry.path} from ${repo.fullName}`);
              const subManifestContent = await githubAdapter.getFileContent(
                repo.fullName,
                manifestEntry.path
              );
              if (subManifestContent) {
                console.info(`Successfully fetched sub-manifest: ${manifestEntry.path}`);
                manifestsToProcess.push({
                  repoName: repo.fullName,
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
        return {
          repository: repo.fullName,
          status: 'error',
          error: `Error parsing ${MONOREPO_CONFIG_FILENAME}: ${e.message}`
        };
      }
    } else {
      console.info(`No ${MONOREPO_CONFIG_FILENAME} found in ${repo.fullName}. Checking for root ${STANDARD_MANIFEST_FILENAME}.`);
      const rootManifestContent = await githubAdapter.getFileContent(
        repo.fullName,
        STANDARD_MANIFEST_FILENAME
      );
      if (rootManifestContent) {
        console.info(`Found root ${STANDARD_MANIFEST_FILENAME} in ${repo.fullName}`);
        manifestsToProcess.push({
          repoName: repo.fullName,
          filePath: STANDARD_MANIFEST_FILENAME,
          content: rootManifestContent
        });
      } else {
        console.warn(`No manifest files found (neither ${MONOREPO_CONFIG_FILENAME} nor root ${STANDARD_MANIFEST_FILENAME}) in ${repo.fullName}`);
        return {
          repository: repo.fullName,
          status: 'skipped',
          error: 'No manifest files found'
        };
      }
    }

    if (manifestsToProcess.length > 0) {
      console.info(`Found ${manifestsToProcess.length} manifest(s) to process for repo ${repo.fullName}:`);
      
      for (const manifest of manifestsToProcess) {
        try {
          const parsedManifest = yaml.load(manifest.content) as GuardianManifest;
          
          if (parsedManifest?.kind !== 'Service') {
            console.warn(`Skipping manifest ${manifest.filePath} as it's not a Service kind`);
            continue;
          }

          // Validate required fields
          if (!parsedManifest.metadata?.name || !parsedManifest.spec?.owner?.team || !parsedManifest.spec?.lifecycle) {
            console.warn(`Skipping manifest ${manifest.filePath} due to missing required fields`);
            continue;
          }

          // Prepare the service data according to our schema
          const serviceData = {
            externalRepoId: repo.externalId,
            gitProvider: githubAdapter.provider,
            organizationName: repo.fullName.split('/')[0],
            repositoryName: repo.name,
            manifestPath: manifest.filePath,
            
            // From manifest metadata
            serviceName: parsedManifest.metadata.name,
            displayName: parsedManifest.metadata.displayName,
            description: parsedManifest.metadata.description,
            annotations: parsedManifest.metadata.annotations,
            
            // From manifest spec
            ownerTeam: parsedManifest.spec.owner.team,
            ownerEmail: parsedManifest.spec.owner.email,
            lifecycle: parsedManifest.spec.lifecycle,
            tier: parsedManifest.spec.tier,
            serviceType: parsedManifest.spec.type,
            partOf: parsedManifest.spec.partOf,
            dependencies: parsedManifest.spec.dependencies,
            techStack: parsedManifest.spec.techStack,
            links: parsedManifest.spec.links,
            defaultChecklistTemplateId: parsedManifest.spec.defaultChecklistTemplateId,
            
            // Store the complete manifest for reference
            rawManifestData: parsedManifest,
            
            // Set timestamps
            lastIngestedAt: new Date(),
          };

          // Upsert the service data
          await db.insert(services)
            .values(serviceData)
            .onConflictDoUpdate({
              target: [services.externalRepoId, services.manifestPath],
              set: {
                ...serviceData,
                updatedAt: new Date(),
              },
            });

          processedServices.push(parsedManifest.metadata.name);
          console.info(`Successfully processed and saved manifest for service: ${parsedManifest.metadata.name}`);
        } catch (error: any) {
          console.error(`Error processing manifest ${manifest.filePath}:`, error.message);
          return {
            repository: repo.fullName,
            status: 'error',
            error: `Error processing manifest ${manifest.filePath}: ${error.message}`
          };
        }
      }
    }

    // Only return success if we actually processed some services
    if (processedServices.length > 0) {
      return {
        repository: repo.fullName,
        status: 'success',
        services: processedServices
      };
    } else {
      return {
        repository: repo.fullName,
        status: 'skipped',
        error: 'No valid service manifests found'
      };
    }

  } catch (error: any) {
    return {
      repository: repo.fullName,
      status: 'error',
      error: error.message
    };
  }
}
