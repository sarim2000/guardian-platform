// services/gitHubAdapter.ts

import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import yaml from 'js-yaml';
import { services } from '@/db/schema/service';
import { db } from '@/db';
import { eq, and, isNull } from 'drizzle-orm';
import {
  BasicRepoInfo,
  IGitProviderAdapter,
  GuardianManifest
} from '@/types/guardian';

export class GitHubAdapter implements IGitProviderAdapter {
  private static instance: GitHubAdapter;
  private octokit: Octokit;
  private gitProvider: string;
  private appId: string;
  private privateKey: string;
  private installationId: string;

  private constructor(
    appId: string,
    privateKey: string,
    installationId: string,
    gitProvider: string = 'github'
  ) {
    if (!appId || !privateKey || !installationId) {
      console.error('GitHub App credentials are required for GitHubAdapter.');
      throw new Error('GitHub App credentials are required for GitHubAdapter.');
    }

    this.appId = appId;
    this.privateKey = privateKey;
    this.installationId = installationId;
    this.gitProvider = gitProvider;

    // Initialize Octokit with GitHub App authentication
    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
        installationId: this.installationId,
      },
    });

    console.info('GitHubAdapter initialized');
  }

  public static getInstance(
    appId: string,
    privateKey: string,
    installationId: string,
    gitProvider: string = 'github'
  ): GitHubAdapter {
    if (!GitHubAdapter.instance) {
      GitHubAdapter.instance = new GitHubAdapter(appId, privateKey, installationId, gitProvider);
    }
    return GitHubAdapter.instance;
  }

  /**
   * Lists all installations for the GitHub App
   * This is useful for debugging to find the correct installation ID
   */
  async listInstallations(): Promise<any> {
    try {
      const response = await this.octokit.apps.listInstallations();
      return response.data;
    } catch (error: any) {
      console.error('Error listing installations:', error);
      throw error;
    }
  }

  get provider(): string {
    return this.gitProvider;
  }

  get client(): Octokit {
    return this.octokit;
  }

  /**
   * Lists repositories that the GitHub App has access to through its installation.
   * Handles pagination automatically by Octokit's paginate method.
   */
  async listRepositories(): Promise<BasicRepoInfo[]> {
    console.info('Fetching repositories accessible to the GitHub App installation');
    try {
      // Use the apps.listReposAccessibleToInstallation endpoint which works with GitHub App
      const response = await this.octokit.apps.listReposAccessibleToInstallation({
        installation_id: this.installationId,
        per_page: 100,
      });

      const repositories = response.data.repositories;
      console.info(`Fetched ${repositories.length} repositories accessible to the GitHub App.`);

      // Filter out archived repositories
      const activeRepos = repositories.filter((repo: any) => !repo.archived);

      console.info(`Found ${activeRepos.length} active repositories.`);

      return activeRepos.map((repo: any) => ({
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
        message: 'GitHub API Error in listRepositories',
        errorDetails: { message: error.message, status: error.status }
      });
      throw new Error(`GitHub API Error in listRepositories: ${error.message}`);
    }
  }

  /**
   * Fetches the content of a specific file from a repository.
   * @param repoName The full name of the repository (e.g., "owner/repo-name").
   * @param filePath The path to the file within the repository.
   * @param ref Optional branch, tag, or commit SHA. Defaults to the repo's default branch if not provided.
   * @returns The file content as a string, or null if the file is not found or an error occurs.
   */
  async getFileContent(
    repoName: string,
    filePath: string,
    ref?: string
  ): Promise<string | null> {
    // Extract owner and repo name from the full repo name
    const [owner, actualRepoName] = repoName.split('/');

    console.info(`Fetching file content: ${repoName}/${filePath}${ref ? ` (ref: ${ref})` : ''}`);
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo: actualRepoName,
        path: filePath,
        ref: ref,
      });

      // Ensure response.data is a file object and has content
      if (Array.isArray(response.data) || !('content' in response.data) || typeof response.data.content !== 'string') {
        console.warn(`Path ${filePath} in ${repoName} is a directory, has no content, or content is not a string.`);
        return null;
      }

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      console.debug(`Successfully fetched content for ${filePath} in ${repoName}`);
      return content;

    } catch (error: any) {
      if (error.status === 404) {
        console.warn(`File not found: ${filePath} in ${repoName}${ref ? ` (ref: ${ref})` : ''}`);
        return null; // File not found is a common case, return null
      }
      // For other errors, log and return null to make ingestion resilient
      console.error({
        message: `Failed to get file content for ${filePath} in ${repoName}`,
        errorDetails: { message: error.message, status: error.status }
      });
      return null;
    }
  }

  /**
   * Gets the README content for a repository
   * Handles both monorepo (org/repo/service) and single-repo (org/repo) cases
   */
  async getReadmeContent(organizationName: string, repoPath: string): Promise<string | null> {
    try {
      // repoPath can be:
      // - "mira-network" (single repo)
      // - "mira-network/router" (monorepo with service)
      const parts = repoPath.split('/');
      
      const repo = parts[0]; // Always the repository name
      const service = parts.length > 1 ? parts[1] : null; // Service name if monorepo
      
      // Construct the path based on whether it's a monorepo or not
      const path = service ? `${service}/README.md` : 'README.md';

      console.info('Parsed repository details:', {
        organizationName,
        repoPath,
        repo,
        service,
        path,
        isMonorepo: !!service
      });

      const response = await this.octokit.repos.getContent({
        owner: organizationName,
        repo: repo,
        path,
      });

      if ('content' in response.data) {
        // GitHub API returns content in base64
        return Buffer.from(response.data.content, 'base64').toString();
      }

      return null;
    } catch (error) {
      console.error('Error fetching README:', error);
      return null;
    }
  }

  /**
   * Gets all documentation files from the docs folder recursively
   * Returns a map of file path to content
   */
  async getDocsContent(organizationName: string, repoPath: string): Promise<{ [filePath: string]: string }> {
    try {
      const parts = repoPath.split('/');
      const repo = parts[0]; // Always the repository name
      const service = parts.length > 1 ? parts[1] : null; // Service name if monorepo
      
      // Construct the docs path based on whether it's a monorepo or not
      const docsPath = 'docs';
      
      console.info('Fetching docs folder:', {
        organizationName,
        repoPath,
        repo,
        service,
        docsPath,
        isMonorepo: !!service
      });

      const docsContent: { [filePath: string]: string } = {};

      // Recursive function to fetch files from a directory
      const fetchFilesFromDirectory = async (dirPath: string): Promise<void> => {
        try {
          const { data } = await this.octokit.repos.getContent({
            owner: organizationName,
            repo: repo,
            path: dirPath,
          });

          if (Array.isArray(data)) {
            // Process files and directories
            for (const item of data) {
              if (item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.markdown'))) {
                // It's a markdown file, fetch its content
                try {
                  const content = await this.getFileContent(`${organizationName}/${repo}`, item.path);
                  if (content) {
                    docsContent[item.path] = content;
                    console.info(`Successfully fetched: ${item.path}`);
                  }
                } catch (error) {
                  console.warn(`Failed to fetch ${item.path}:`, error);
                }
              } else if (item.type === 'dir') {
                // It's a directory, recursively fetch files from it
                console.info(`Exploring subdirectory: ${item.path}`);
                await fetchFilesFromDirectory(item.path);
              }
            }
          }
        } catch (error: any) {
          if (error.status === 404) {
            console.info(`Directory not found: ${dirPath}`);
          } else {
            console.error(`Error accessing directory ${dirPath}:`, error);
          }
        }
      };

      // Start the recursive fetch from the docs folder
      await fetchFilesFromDirectory(docsPath);

      console.info(`Total markdown files found: ${Object.keys(docsContent).length}`);
      return docsContent;
    } catch (error) {
      console.error('Error fetching docs content:', error);
      return {};
    }
  }
}

export interface IngestionResult {
  repository: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
  services?: string[]; // List of service names that were processed
  deletedServices?: string[]; // List of service names that were soft deleted
}

export async function monorepoIngestionLogic(githubAdapter: GitHubAdapter, repo: BasicRepoInfo): Promise<IngestionResult> {
  const GUARDIAN_FOLDER = '.guardian';
  let manifestsToProcess: Array<{ repoName: string, filePath: string, content: string }> = [];
  const processedServices: string[] = [];
  const deletedServiceNames: string[] = [];
  const currentManifestPaths: string[] = [];

  console.info(`Processing repository: ${repo.fullName}`);

  try {
    // Try to get the contents of the .guardian folder
    const guardianFolderContent = await githubAdapter.getFileContent(
      repo.fullName,
      GUARDIAN_FOLDER
    );

    // If .guardian folder doesn't exist or is empty, check if it's a directory
    // We need to use the GitHub API to list directory contents
    try {
      const { data } = await githubAdapter.client.repos.getContent({
        owner: repo.fullName.split('/')[0],
        repo: repo.fullName.split('/')[1],
        path: GUARDIAN_FOLDER,
      });

      if (Array.isArray(data)) {
        // Filter for .yml and .yaml files
        const yamlFiles = data.filter(file => 
          file.type === 'file' && 
          (file.name.endsWith('.yml') || file.name.endsWith('.yaml'))
        );

        if (yamlFiles.length === 0) {
          console.warn(`No YAML files found in ${GUARDIAN_FOLDER} folder in ${repo.fullName}`);
          
          // Soft delete all services for this repo since .guardian folder exists but has no YAML files
          await db.update(services)
            .set({ 
              deletedAt: new Date(),
              updatedAt: new Date()
            })
            .where(and(
              eq(services.externalRepoId, repo.externalId),
              isNull(services.deletedAt)
            ));
          
          return {
            repository: repo.fullName,
            status: 'success',
            error: 'No YAML files found in .guardian folder - marked all services as deleted'
          };
        }

        console.info(`Found ${yamlFiles.length} YAML file(s) in ${GUARDIAN_FOLDER} folder in ${repo.fullName}`);

        // Fetch content for each YAML file
        for (const file of yamlFiles) {
          const filePath = `${GUARDIAN_FOLDER}/${file.name}`;
          currentManifestPaths.push(filePath);
          console.info(`Fetching service manifest: ${filePath} from ${repo.fullName}`);
          
          const fileContent = await githubAdapter.getFileContent(
            repo.fullName,
            filePath
          );
          
          if (fileContent) {
            console.info(`Successfully fetched service manifest: ${filePath}`);
            manifestsToProcess.push({
              repoName: repo.fullName,
              filePath: filePath,
              content: fileContent
            });
          } else {
            console.warn(`Could not fetch service manifest: ${filePath} from ${repo.fullName}`);
          }
        }
      } else {
        console.warn(`${GUARDIAN_FOLDER} exists but is not a directory in ${repo.fullName}`);
        return {
          repository: repo.fullName,
          status: 'skipped',
          error: '.guardian exists but is not a directory'
        };
      }
    } catch (error: any) {
      if (error.status === 404) {
        console.warn(`No ${GUARDIAN_FOLDER} folder found in ${repo.fullName}`);
        
        // Soft delete all services for this repo since .guardian folder doesn't exist
        const deletedCount = await db.update(services)
          .set({ 
            deletedAt: new Date(),
            updatedAt: new Date()
          })
          .where(and(
            eq(services.externalRepoId, repo.externalId),
            isNull(services.deletedAt)
          ));
        
        return {
          repository: repo.fullName,
          status: 'success',
          error: 'No .guardian folder found - marked all services as deleted'
        };
      } else {
        console.error(`Error accessing ${GUARDIAN_FOLDER} folder in ${repo.fullName}: ${error.message}`);
        return {
          repository: repo.fullName,
          status: 'error',
          error: `Error accessing .guardian folder: ${error.message}`
        };
      }
    }

    if (manifestsToProcess.length > 0) {
      console.info(`Found ${manifestsToProcess.length} service manifest(s) to process for repo ${repo.fullName}:`);
      
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
            
            // Set timestamps and ensure not deleted
            lastIngestedAt: new Date(),
            deletedAt: null, // Ensure service is marked as not deleted
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

      // Soft delete services that are no longer present in the repository
      console.info(`Checking for services to soft delete in ${repo.fullName}`);
      
      // Get all existing services for this repo that are not already deleted
      const existingServices = await db.select({
        manifestPath: services.manifestPath,
        serviceName: services.serviceName
      })
      .from(services)
      .where(and(
        eq(services.externalRepoId, repo.externalId),
        isNull(services.deletedAt)
      ));

      // Find services that exist in DB but not in current manifests
      const servicesToDelete = existingServices.filter(
        existingService => !currentManifestPaths.includes(existingService.manifestPath)
      );

      if (servicesToDelete.length > 0) {
        console.info(`Soft deleting ${servicesToDelete.length} service(s) that are no longer present in ${repo.fullName}`);
        
        for (const serviceToDelete of servicesToDelete) {
          await db.update(services)
            .set({ 
              deletedAt: new Date(),
              updatedAt: new Date()
            })
            .where(and(
              eq(services.externalRepoId, repo.externalId),
              eq(services.manifestPath, serviceToDelete.manifestPath)
            ));
          
          deletedServiceNames.push(serviceToDelete.serviceName);
          console.info(`Soft deleted service: ${serviceToDelete.serviceName} (${serviceToDelete.manifestPath})`);
        }
      }
    }

    // Return success with information about processed and deleted services
    if (processedServices.length > 0 || deletedServiceNames.length > 0) {
      return {
        repository: repo.fullName,
        status: 'success',
        services: processedServices,
        deletedServices: deletedServiceNames.length > 0 ? deletedServiceNames : undefined
      };
    } else {
      return {
        repository: repo.fullName,
        status: 'skipped',
        error: 'No valid service manifests found in .guardian folder'
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
