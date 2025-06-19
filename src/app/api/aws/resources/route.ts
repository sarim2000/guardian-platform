import { NextRequest, NextResponse } from 'next/server';
import { db, awsDiscoveredResources, awsAccounts } from '@/db';
import { eq, and, desc, asc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const resourceType = searchParams.get('resourceType');
    const region = searchParams.get('region');
    const accountName = searchParams.get('accountName');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where conditions for resources table
    const resourceWhereConditions = [];
    if (resourceType) {
      resourceWhereConditions.push(eq(awsDiscoveredResources.resourceType, resourceType));
    }
    if (region) {
      resourceWhereConditions.push(eq(awsDiscoveredResources.awsRegion, region));
    }
    
    // Build where conditions for accounts table
    const accountWhereConditions = [];
    if (accountName) {
      accountWhereConditions.push(eq(awsAccounts.accountName, accountName));
    }
    
    // Combine all where conditions
    const allWhereConditions = [...resourceWhereConditions, ...accountWhereConditions];
    const whereClause = allWhereConditions.length > 0 ? and(...allWhereConditions) : undefined;
    
    // Get resources with pagination and sorting
    const offset = (page - 1) * limit;
    
    // Always join with aws_accounts table to get account names
    // Use LEFT JOIN to include resources even if they don't have a proper foreign key relationship
    const resources = await db
      .select({
        id: awsDiscoveredResources.id,
        arn: awsDiscoveredResources.arn,
        awsAccountId: awsDiscoveredResources.awsAccountId,
        awsRegion: awsDiscoveredResources.awsRegion,
        resourceType: awsDiscoveredResources.resourceType,
        nameTag: awsDiscoveredResources.nameTag,
        allTags: awsDiscoveredResources.allTags,
        resourceState: awsDiscoveredResources.resourceState,
        healthStatus: awsDiscoveredResources.healthStatus,
        isActive: awsDiscoveredResources.isActive,
        operationalMetrics: awsDiscoveredResources.operationalMetrics,
        statusDetails: awsDiscoveredResources.statusDetails,
        firstDiscoveredAt: awsDiscoveredResources.firstDiscoveredAt,
        lastSeenAt: awsDiscoveredResources.lastSeenAt,
        statusLastChecked: awsDiscoveredResources.statusLastChecked,
        accountName: awsAccounts.accountName,
      })
      .from(awsDiscoveredResources)
      .leftJoin(awsAccounts, eq(awsDiscoveredResources.awsAccountConfigId, awsAccounts.id))
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? asc(awsDiscoveredResources.lastSeenAt) : desc(awsDiscoveredResources.lastSeenAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(awsDiscoveredResources)
      .leftJoin(awsAccounts, eq(awsDiscoveredResources.awsAccountConfigId, awsAccounts.id))
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
        accountName,
      },
    });
  } catch (error) {
    console.error('Error fetching AWS resources:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
} 
