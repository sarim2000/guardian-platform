import { db } from '@/db';
import { services } from '@/db/schema/service';
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const organizations = await db
      .selectDistinct({ organizationName: services.organizationName })
      .from(services)
      .orderBy(services.organizationName);

    const orgNames = organizations.map(o => o.organizationName);
    
    return NextResponse.json(orgNames);
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
} 
