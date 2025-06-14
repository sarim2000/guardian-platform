import { NextRequest, NextResponse } from 'next/server';
import { GitHubAdapter, IngestionResult } from '@/services/gitHubAdapter';
import env from '@/utils/env';
import { monorepoIngestionLogic } from '@/services/gitHubAdapter';

// POST /api/catalog/ingestion/trigger - endpoint for triggering the catalog ingestion process to db
export async function POST(request: NextRequest) {
  try {
    const appId = env.GITHUB_APP_ID;
    const privateKey = env.GITHUB_APP_PRIVATE_KEY;
    const installationId = env.GITHUB_APP_INSTALLATION_ID;

    if (!appId || !privateKey || !installationId) {
      return NextResponse.json(
        { error: 'Missing required GitHub App credentials' },
        { status: 500 }
      );
    }

    const githubAdapter = GitHubAdapter.getInstance(
      appId,
      privateKey,
      installationId
    );

    const repos = await githubAdapter.listRepositories();
    
    // Process each repository
    const results: IngestionResult[] = [];
    for (const repo of repos) {
      const result = await monorepoIngestionLogic(githubAdapter, repo);
      results.push(result);
    }

    // Filter results to show only successful or error cases (skip 'skipped' ones)
    const filteredResults = results.filter(r => r.status !== 'skipped');

    return NextResponse.json({
      message: 'Catalog ingestion completed',
      summary: {
        total: results.length,
        processed: filteredResults.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        skipped: results.filter(r => r.status === 'skipped').length,
      },
      processed: filteredResults
    });
  } catch (error: any) {
    console.error('Error during catalog ingestion:', error);
    return NextResponse.json(
      { error: 'Failed to process catalog ingestion', details: error.message },
      { status: 500 }
    );
  }
}
