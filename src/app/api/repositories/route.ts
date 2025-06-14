import { db } from '@/db';
import { services } from '@/db/schema/service';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgName = searchParams.get('org');

  if (!orgName) {
    return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
  }

  try {
    const repos = await db
      .selectDistinct({
        repositoryName: services.repositoryName,
      })
      .from(services)
      .where(eq(services.organizationName, orgName))
      .orderBy(services.repositoryName);

    const repoNames = repos.map(r => r.repositoryName);

    return NextResponse.json(repoNames);
  } catch (error) {
    console.error(`Failed to fetch repositories for ${orgName}:`, error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
} 
