import { db } from '@/db';
import { services } from '@/db/schema/service';
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgName = searchParams.get('org');
  const repoName = searchParams.get('repo');
  const serviceName = searchParams.get('service');

  if (!orgName || !repoName) {
    return NextResponse.json({ error: 'Organization and repository names are required' }, { status: 400 });
  }

  try {
    const queryConditions = [
        eq(services.organizationName, orgName),
        eq(services.repositoryName, repoName),
    ];

    // The service name is the most specific identifier
    if (serviceName) {
        queryConditions.push(eq(services.serviceName, serviceName));
    }

    const [service] = await db
      .select()
      .from(services)
      .where(and(...queryConditions))
      .limit(1);

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error(`Failed to fetch service details for ${orgName}/${repoName}:`, error);
    return NextResponse.json({ error: 'Failed to fetch service details' }, { status: 500 });
  }
} 
