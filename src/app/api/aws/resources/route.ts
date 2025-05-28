import { NextRequest, NextResponse } from 'next/server';
import { db, awsDiscoveredResources } from '@/db';
import { eq, and, desc, asc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const resourceType = searchParams.get('resourceType');
    const region = searchParams.get('region');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where conditions
    const whereConditions = [];
    if (resourceType) {
      whereConditions.push(eq(awsDiscoveredResources.resourceType, resourceType));
    }
    if (region) {
      whereConditions.push(eq(awsDiscoveredResources.awsRegion, region));
    }
    
    // Build the where clause
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Get resources with pagination and sorting
    const offset = (page - 1) * limit;
    const resources = await db
      .select()
      .from(awsDiscoveredResources)
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? asc(awsDiscoveredResources.lastSeenAt) : desc(awsDiscoveredResources.lastSeenAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(awsDiscoveredResources)
      .where(whereClause);
    
    const totalCount = totalCountResult[0]?.count || 0;
    
    return NextResponse.json({
      success: true,
      data: resources,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        resourceType,
        region,
      },
    });
  } catch (error) {
    console.error('Error fetching AWS resources:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
} 
