import { 
  ResourceGroupsTaggingAPIClient, 
  GetResourcesCommand
} from '@aws-sdk/client-resource-groups-tagging-api';
import { db, awsAccounts, awsDiscoveredResources } from '@/db';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import env from '@/utils/env';

interface AWSAccountCredentials {
  id: string;
  accountName: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  defaultRegion: string;
  regions: string[];
}

interface DiscoveredResource {
  arn: string;
  awsAccountConfigId: string; // Foreign key to aws_accounts table
  awsAccountId: string; // AWS Account ID (12-digit number)
  awsRegion: string;
  resourceType: string;
  nameTag?: string;
  allTags: Record<string, string>;
  rawMetadata: any;
  resourceState?: string;
  healthStatus?: string;
  isActive?: boolean;
  operationalMetrics?: Record<string, any>;
  statusDetails?: Record<string, any>;
}

export class MultiAccountAWSDiscoveryService {
  private readonly encryptionKey: string;

  constructor() {
    // Use a secure encryption key from environment
    this.encryptionKey = env.AWS_CREDENTIALS_ENCRYPTION_KEY;
  }

  /**
   * Encrypt sensitive credential data
   */
  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, crypto.scryptSync(this.encryptionKey, 'salt', 32), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive credential data
   */
  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc';
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, crypto.scryptSync(this.encryptionKey, 'salt', 32), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Add a new AWS account to the system
   */
  async addAWSAccount(accountData: {
    accountId: string;
    accountName: string;
    accessKeyId: string;
    secretAccessKey: string;
    defaultRegion: string;
    regions: string[];
    description?: string;
    organizationRole?: string;
    isDefault?: boolean;
  }): Promise<string> {
    try {
      console.log("Adding AWS account", this.encryptionKey);
      // Encrypt sensitive credentials
      const encryptedAccessKey = this.encrypt(accountData.accessKeyId);
      const encryptedSecretKey = this.encrypt(accountData.secretAccessKey);

      // Verify credentials by making a test API call
      const testClient = new ResourceGroupsTaggingAPIClient({
        credentials: {
          accessKeyId: accountData.accessKeyId,
          secretAccessKey: accountData.secretAccessKey,
        },
        region: accountData.defaultRegion,
      });

      try {
        const result = await testClient.send(new GetResourcesCommand({ ResourcesPerPage: 1 }));
        console.log('test aws result', result);
      } catch (error) {
        throw new Error('Invalid AWS credentials provided');
      }

      // If this is the first account or marked as default, unset other defaults
      if (accountData.isDefault) {
        await db
          .update(awsAccounts)
          .set({ isDefault: false })
          .where(eq(awsAccounts.isDefault, true));
      }

      // Insert the new account
      const result = await db.insert(awsAccounts).values({
        accountName: accountData.accountName,
        accountId: accountData.accountId, // We'll update this after we can query it
        accessKeyId: encryptedAccessKey,
        secretAccessKey: encryptedSecretKey,
        defaultRegion: accountData.defaultRegion,
        regions: accountData.regions,
        description: accountData.description,
        organizationRole: accountData.organizationRole,
        isDefault: accountData.isDefault || false,
      }).returning({ id: awsAccounts.id });

      return result[0].id;
    } catch (error) {
      console.error('Error adding AWS account:', error);
      throw error;
    }
  }

  /**
   * Get all active AWS accounts
   */
  async getActiveAccounts(): Promise<AWSAccountCredentials[]> {
    const accounts = await db
      .select()
      .from(awsAccounts)
      .where(eq(awsAccounts.isActive, true));

    return accounts.map(account => ({
      id: account.id,
      accountName: account.accountName,
      accountId: account.accountId,
      accessKeyId: this.decrypt(account.accessKeyId),
      secretAccessKey: this.decrypt(account.secretAccessKey),
      defaultRegion: account.defaultRegion,
      regions: account.regions || [account.defaultRegion],
    }));
  }

  /**
   * Discover resources across all active AWS accounts
   */
  async discoverAllAccountResources(): Promise<DiscoveredResource[]> {
    const accounts = await this.getActiveAccounts();
    const allResources: DiscoveredResource[] = [];

    console.log(`Starting multi-account AWS resource discovery across ${accounts.length} accounts...`);

    for (const account of accounts) {
      try {
        console.log(`Discovering resources for account: ${account.accountName} (${account.accountId})`);
        
        const accountResources = await this.discoverAccountResources(account);
        allResources.push(...accountResources);

        // Update last used timestamp
        await db
          .update(awsAccounts)
          .set({ lastUsed: new Date() })
          .where(eq(awsAccounts.id, account.id));

      } catch (error) {
        console.error(`Error discovering resources for account ${account.accountName}:`, error);
        // Continue with other accounts
      }
    }

    // Store all discovered resources
    await this.storeDiscoveredResources(allResources);

    console.log(`Multi-account discovery completed. Found ${allResources.length} resources across ${accounts.length} accounts.`);
    return allResources;
  }

  /**
   * Discover resources for a specific AWS account
   */
  async discoverAccountResources(account: AWSAccountCredentials): Promise<DiscoveredResource[]> {
    const discoveredResources: DiscoveredResource[] = [];

    try {
      // Import and create discovery service with account-specific credentials
      const { AWSDiscoveryService } = await import('./aws-discovery');
      
      const discoveryService = new AWSDiscoveryService({
        accessKeyId: account.accessKeyId,
        secretAccessKey: account.secretAccessKey,
        region: account.defaultRegion,
        regions: account.regions,
        awsAccountConfigId: account.id, // Pass the account config ID for proper foreign key relationship
      });

      const resources = await discoveryService.discoverResources();

      // Transform the resources to include the account config ID
      for (const resource of resources) {
        discoveredResources.push({
          ...resource,
          awsAccountConfigId: account.id, // Ensure the foreign key is set
          awsAccountId: account.accountId, // Ensure we have the AWS account ID
        });
      }

      return discoveredResources;
    } catch (error) {
      console.error(`Error during discovery for account ${account.accountName}:`, error);
      throw error;
    }
  }

  /**
   * Store discovered resources (same as original but handles multiple accounts)
   */
  private async storeDiscoveredResources(resources: DiscoveredResource[]): Promise<void> {
    console.log(`Storing ${resources.length} discovered resources across multiple accounts...`);
    
    // Use the same storage logic as the original service
    for (const resource of resources) {
      try {
        const existing = await db
          .select()
          .from(awsDiscoveredResources)
          .where(eq(awsDiscoveredResources.arn, resource.arn))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(awsDiscoveredResources)
            .set({
              awsAccountConfigId: resource.awsAccountConfigId,
              awsAccountId: resource.awsAccountId,
              nameTag: resource.nameTag,
              allTags: resource.allTags,
              rawMetadata: resource.rawMetadata,
              resourceState: resource.resourceState,
              healthStatus: resource.healthStatus,
              isActive: resource.isActive,
              operationalMetrics: resource.operationalMetrics,
              statusDetails: resource.statusDetails,
              lastSeenAt: new Date(),
              statusLastChecked: new Date(),
            })
            .where(eq(awsDiscoveredResources.arn, resource.arn));
        } else {
          await db.insert(awsDiscoveredResources).values({
            arn: resource.arn,
            awsAccountConfigId: resource.awsAccountConfigId,
            awsAccountId: resource.awsAccountId,
            awsRegion: resource.awsRegion,
            resourceType: resource.resourceType,
            nameTag: resource.nameTag,
            allTags: resource.allTags,
            rawMetadata: resource.rawMetadata,
            resourceState: resource.resourceState,
            healthStatus: resource.healthStatus,
            isActive: resource.isActive,
            operationalMetrics: resource.operationalMetrics,
            statusDetails: resource.statusDetails,
            statusLastChecked: new Date(),
          });
        }
      } catch (error) {
        console.error(`Error storing resource ${resource.arn}:`, error);
      }
    }
    
    console.log('Finished storing multi-account discovered resources');
  }

  /**
   * Remove an AWS account
   */
  async removeAWSAccount(accountId: string): Promise<void> {
    await db
      .update(awsAccounts)
      .set({ isActive: false })
      .where(eq(awsAccounts.id, accountId));
  }

  /**
   * List all AWS accounts (for management UI)
   */
  async listAWSAccounts(): Promise<Array<{
    id: string;
    accountName: string;
    accountId: string;
    defaultRegion: string;
    regions: string[];
    isActive: boolean;
    isDefault: boolean;
    description?: string;
    organizationRole?: string;
    createdAt: Date;
    lastUsed?: Date;
  }>> {
    const accounts = await db.select({
      id: awsAccounts.id,
      accountName: awsAccounts.accountName,
      accountId: awsAccounts.accountId,
      defaultRegion: awsAccounts.defaultRegion,
      regions: awsAccounts.regions,
      isActive: awsAccounts.isActive,
      isDefault: awsAccounts.isDefault,
      description: awsAccounts.description,
      organizationRole: awsAccounts.organizationRole,
      createdAt: awsAccounts.createdAt,
      lastUsed: awsAccounts.lastUsed,
    }).from(awsAccounts);

    return accounts.map(account => ({
      ...account,
      regions: account.regions || [account.defaultRegion],
      description: account.description || undefined,
      organizationRole: account.organizationRole || undefined,
      lastUsed: account.lastUsed || undefined,
    }));
  }
} 
