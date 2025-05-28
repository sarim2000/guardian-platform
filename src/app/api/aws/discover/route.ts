import { NextRequest, NextResponse } from 'next/server';
import { AWSDiscoveryService } from '@/services/aws-discovery';

export async function POST(request: NextRequest) {
  try {
    const discoveryService = new AWSDiscoveryService();
    const discoveredResources = await discoveryService.discoverResources();
    
    return NextResponse.json({
      success: true,
      message: `Successfully discovered ${discoveredResources.length} AWS resources`,
      resourceCount: discoveredResources.length,
      resources: discoveredResources.map(r => ({
        arn: r.arn,
        resourceType: r.resourceType,
        nameTag: r.nameTag,
        awsRegion: r.awsRegion,
      })),
    });
  } catch (error) {
    console.error('AWS discovery error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
} 
