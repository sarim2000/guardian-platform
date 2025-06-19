import { NextRequest, NextResponse } from 'next/server';
import { MultiAccountAWSDiscoveryService } from '@/services/aws-multi-account-discovery';

const multiAccountService = new MultiAccountAWSDiscoveryService();

export async function GET() {
  try {
    const accounts = await multiAccountService.listAWSAccounts();
    
    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('Error listing AWS accounts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list AWS accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      accountName,
      accessKeyId,
      secretAccessKey,
      defaultRegion,
      regions,
      description,
      organizationRole,
      isDefault
    } = body;

    // Validate required fields
    if (!accountName || !accessKeyId || !secretAccessKey || !defaultRegion) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: accountName, accessKeyId, secretAccessKey, defaultRegion' 
        },
        { status: 400 }
      );
    }

    // Validate regions array
    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Regions must be a non-empty array' 
        },
        { status: 400 }
      );
    }

    const accountId = await multiAccountService.addAWSAccount({
      accountName,
      accessKeyId,
      secretAccessKey,
      defaultRegion,
      regions,
      description,
      organizationRole,
      isDefault: isDefault || false,
    });

    return NextResponse.json({
      success: true,
      data: { accountId },
      message: 'AWS account added successfully'
    });
  } catch (error) {
    console.error('Error adding AWS account:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add AWS account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: accountId' 
        },
        { status: 400 }
      );
    }

    await multiAccountService.removeAWSAccount(accountId);

    return NextResponse.json({
      success: true,
      message: 'AWS account removed successfully'
    });
  } catch (error) {
    console.error('Error removing AWS account:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove AWS account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
