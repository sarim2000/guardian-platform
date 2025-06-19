import { NextRequest, NextResponse } from 'next/server';
import { MultiAccountAWSDiscoveryService } from '@/services/aws-multi-account-discovery';

const multiAccountService = new MultiAccountAWSDiscoveryService();

export async function POST() {
  try {
    console.log('Starting AWS resource discovery...');
    
    const discoveredResources = await multiAccountService.discoverAllAccountResources();
    
    // Get unique account count
    const accountsProcessed = new Set(discoveredResources.map(r => r.awsAccountId)).size;
    
    return NextResponse.json({
      success: true,
      message: 'AWS resource discovery completed successfully',
      resourcesDiscovered: discoveredResources.length,
      accountsProcessed,
    });
  } catch (error) {
    console.error('Error during AWS resource discovery:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to discover AWS resources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
