import { NextRequest, NextResponse } from 'next/server';
import { GitHubAdapter, IngestionResult } from '@/services/gitHubAdapter';
import env from '@/utils/env';
import { monorepoIngestionLogic } from '@/services/gitHubAdapter';

// POST /api/catalog/ingestion/trigger - endpoint for triggering the catalog ingestion process to db
export async function POST(request: NextRequest) {
  try {
    const pat = env.GIT_PROVIDER_PAT;
    const orgName = env.GIT_PROVIDER_ORGANIZATION_NAME;

    if (!pat || !orgName) {
      return NextResponse.json(
        { error: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    const githubAdapter = new GitHubAdapter(pat, orgName);

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
