import { NextResponse } from 'next/server';
import { LlamaService } from '@/services/llama';
import { GitHubAdapter } from '@/services/gitHubAdapter';
import env from '@/utils/env';

export async function POST(request: Request) {
  try {
    const { serviceName, organizationName, repositoryName, manifestPath } = await request.json();

    if (!serviceName || !organizationName || !repositoryName || !manifestPath) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceName, organizationName, repositoryName, manifestPath' },
        { status: 400 }
      );
    }

    console.info('Received request with:', { serviceName, organizationName, repositoryName, manifestPath });

    // Determine if it's a monorepo based on manifest path
    // Example: .guardian/router.yml indicates router service in monorepo
    const isMonorepo = manifestPath.includes('/') && 
                      manifestPath !== '.guardian/service.yml';
    
    const repoPath = isMonorepo 
      ? `${repositoryName}/${serviceName}` 
      : repositoryName;

    console.info('Constructed repo path:', {
      organizationName,
      repositoryName,
      serviceName,
      repoPath,
      manifestPath,
      isMonorepo
    });

    // Get README content from GitHub
    const githubAdapter = GitHubAdapter.getInstance(
      env.GITHUB_APP_ID,
      env.GITHUB_APP_PRIVATE_KEY,
      env.GITHUB_APP_INSTALLATION_ID
    );
    const readmeContent = await githubAdapter.getReadmeContent(organizationName, repoPath);

    if (!readmeContent) {
      return NextResponse.json(
        { error: 'README not found' },
        { status: 404 }
      );
    }

    // Ingest README into LlamaIndex
    const llamaService = LlamaService.getInstance(organizationName);
    await llamaService.ingestReadme(repositoryName, serviceName, readmeContent);

    // Fire and forget: Ingest docs content (don't await)
    // githubAdapter.getDocsContent(organizationName, repoPath).then(docsContent => {
    //   console.info(`Got ${Object.keys(docsContent).length} docs files for ${serviceName}, starting ingestion`);
    //   llamaService.ingestDocs(repositoryName, serviceName, docsContent);
    // }).catch(error => {
    //   console.error(`Failed to fetch/ingest docs for ${serviceName}:`, error);
    // });

    return NextResponse.json({ 
      success: true,
      message: 'Documentation ingested successfully'
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    return NextResponse.json(
      { error: 'Failed to ingest documentation' },
      { status: 500 }
    );
  }
} 
