import { 
  ResourceGroupsTaggingAPIClient, 
  GetResourcesCommand
} from '@aws-sdk/client-resource-groups-tagging-api';
import { 
  EC2Client, 
  DescribeInstancesCommand,
  DescribeInstanceStatusCommand
} from '@aws-sdk/client-ec2';
import { 
  RDSClient, 
  DescribeDBInstancesCommand,
  DescribeDBClustersCommand
} from '@aws-sdk/client-rds';
import { 
  LambdaClient, 
  GetFunctionCommand,
  GetFunctionConfigurationCommand
} from '@aws-sdk/client-lambda';
import { 
  ECSClient, 
  DescribeServicesCommand,
  DescribeClustersCommand,
  ListServicesCommand
} from '@aws-sdk/client-ecs';
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  DescribeTargetGroupsCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { 
  CloudWatchClient, 
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import { db, awsDiscoveredResources } from '@/db';
import { eq } from 'drizzle-orm';

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

interface DiscoveredResource {
  arn: string;
  awsAccountConfigId?: string; // Optional for backward compatibility
  awsAccountId: string;
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

// Well-tested resource types that work reliably with Resource Groups Tagging API
const SUPPORTED_RESOURCE_TYPES: string[] = [
  // EC2 Resources
  'ec2:instance',
  'ec2:volume',
  'ec2:security-group',
  'ec2:vpc',
  'ec2:subnet',
  'ec2:internet-gateway',
  'ec2:route-table',
  'ec2:network-acl',
  'ec2:nat-gateway',
  'ec2:transit-gateway',
  'ec2:launch-template',
  'ec2:key-pair',
  'ec2:snapshot',
  'ec2:image',
  
  // RDS Resources
  'rds:db',
  'rds:cluster',
  'rds:db-subnet-group',
  'rds:db-parameter-group',
  'rds:snapshot',
  'rds:cluster-snapshot',
  
  // S3 Resources
  's3:bucket',
  
  // Lambda Resources
  'lambda:function',
  
  // ECS Resources
  'ecs:cluster',
  'ecs:service',
  'ecs:task-definition',
  
  // DynamoDB Resources
  'dynamodb:table',
  
  // SNS/SQS Resources
  'sns:topic',
  'sqs:queue',
  
  // Load Balancer Resources
  'elasticloadbalancing:loadbalancer',
  'elasticloadbalancing:targetgroup',
  
  // CloudFormation Resources
  'cloudformation:stack',
  
  // IAM Resources
  'iam:role',
  'iam:user',
  'iam:group',
  'iam:policy',
  
  // CloudWatch Resources
  'logs:log-group',
  'cloudwatch:alarm',
  'events:rule',
  
  // Kinesis Resources
  'kinesis:stream',
  'firehose:deliverystream',
  
  // OpenSearch Resources (removed elasticsearch as it's deprecated/unsupported)
  'opensearch:domain',
  
  // Redshift Resources
  'redshift:cluster',
  
  // ElastiCache Resources
  'elasticache:cluster',
  'elasticache:replication-group',
  
  // API Gateway Resources
  'apigateway:restapi',
  'apigateway:stage',
  
  // Route53 Resources
  'route53:hostedzone',
  
  // CloudFront Resources
  'cloudfront:distribution',
  
  // Secrets Manager Resources
  'secretsmanager:secret',
  
  // Systems Manager Resources
  'ssm:parameter',
  'ssm:document',
  
  // EKS Resources
  'eks:cluster',
  'eks:nodegroup',
  
  // ECR Resources
  'ecr:repository',
  
  // CodeBuild Resources
  'codebuild:project',
  
  // CodeCommit Resources
  'codecommit:repository',
  
  // CodeDeploy Resources
  'codedeploy:application',
  
  // CodePipeline Resources
  'codepipeline:pipeline',
];

export class AWSDiscoveryService {
  private credentials: AWSCredentials;
  private regions: string[];
  private awsAccountConfigId?: string; // Optional for multi-account support

  constructor(credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    regions?: string[];
    awsAccountConfigId?: string;
  }) {
    this.credentials = {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region,
    };
    this.regions = credentials.regions || [credentials.region];
    this.awsAccountConfigId = credentials.awsAccountConfigId;

    if (!this.credentials.accessKeyId || !this.credentials.secretAccessKey) {
      throw new Error('AWS credentials are required');
    }
  }

  async discoverResources(): Promise<DiscoveredResource[]> {
    const discoveredResources: DiscoveredResource[] = [];

    try {
      console.log(`Starting AWS resource discovery across ${this.regions.length} regions...`);
      
      // Use Resource Groups Tagging API for comprehensive resource discovery
      const taggingResources = await this.discoverResourcesWithTaggingAPI();
      discoveredResources.push(...taggingResources);

      // Enhance with operational status information
      await this.enrichWithOperationalStatus(discoveredResources);

      // Store discovered resources in database
      await this.storeDiscoveredResources(discoveredResources);

      console.log(`Successfully discovered ${discoveredResources.length} AWS resources`);
      return discoveredResources;
    } catch (error) {
      console.error('Error during AWS resource discovery:', error);
      throw error;
    }
  }

  private async discoverResourcesWithTaggingAPI(): Promise<DiscoveredResource[]> {
    const allResources: DiscoveredResource[] = [];

    for (const region of this.regions) {
      console.log(`Discovering resources in region ${region} using Resource Groups API...`);
      
      const client = new ResourceGroupsTaggingAPIClient({
        credentials: {
          accessKeyId: this.credentials.accessKeyId,
          secretAccessKey: this.credentials.secretAccessKey,
        },
        region: region,
      });

      try {
        // Process in smaller batches to avoid API limits
        const batchSize = 5; // Even smaller batches to be more conservative
        for (let i = 0; i < SUPPORTED_RESOURCE_TYPES.length; i += batchSize) {
          const resourceTypeBatch = SUPPORTED_RESOURCE_TYPES.slice(i, i + batchSize);
          
          let paginationToken: string | undefined;
          do {
            try {
              const command = new GetResourcesCommand({
                ResourceTypeFilters: resourceTypeBatch,
                ResourcesPerPage: 50,
                PaginationToken: paginationToken,
              });

              const response = await client.send(command);

              if (response.ResourceTagMappingList) {
                for (const resource of response.ResourceTagMappingList) {
                  if (resource.ResourceARN) {
                    const discoveredResource = this.parseResourceFromTaggingAPI(resource, region);
                    if (discoveredResource) {
                      allResources.push(discoveredResource);
                    }
                  }
                }
              }

              paginationToken = response.PaginationToken;
            } catch (batchError: any) {
              console.warn(`Error processing resource type batch in ${region}: ${batchError.message}`);
              // Continue with next batch
              break;
            }
          } while (paginationToken);
          
          // Add delay between batches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (regionError) {
        console.warn(`Error discovering resources in region ${region}:`, regionError);
        // Continue with next region
      }
    }

    return allResources;
  }

  private parseResourceFromTaggingAPI(resource: any, region: string): DiscoveredResource | null {
    if (!resource.ResourceARN) return null;

    try {
      // Log all raw data from AWS for analysis
      console.log('=== RAW AWS RESOURCE DATA ===');
      console.log('ARN:', resource.ResourceARN);
      console.log('Region:', region);
      console.log('Full Resource Object:', JSON.stringify(resource, null, 2));
      console.log('================================');

      // Parse ARN to extract account ID and resource type
      const arnParts = resource.ResourceARN.split(':');
      if (arnParts.length < 6) return null;

      const awsAccountId = arnParts[4];
      const service = arnParts[2];
      const resourcePart = arnParts[5];
      
      // Extract resource type from ARN
      let resourceType = `${service}::${resourcePart.split('/')[0]}`;
      
      // Normalize resource type for better categorization
      resourceType = this.normalizeResourceType(service, resourcePart);

      // Extract tags
      const allTags: Record<string, string> = {};
      let nameTag: string | undefined;

      if (resource.Tags) {
        for (const tag of resource.Tags) {
          if (tag.Key && tag.Value) {
            allTags[tag.Key] = tag.Value;
            if (tag.Key === 'Name') {
              nameTag = tag.Value;
            }
          }
        }
      }

      // If no Name tag, try to extract name from ARN
      if (!nameTag) {
        nameTag = this.extractNameFromARN(resource.ResourceARN);
      }

      return {
        arn: resource.ResourceARN,
        awsAccountConfigId: this.awsAccountConfigId, // Will be set if using multi-account discovery
        awsAccountId,
        awsRegion: region,
        resourceType,
        nameTag,
        allTags,
        rawMetadata: resource,
      };
    } catch (error) {
      console.warn(`Error parsing resource ${resource.ResourceARN}:`, error);
      return null;
    }
  }

  private normalizeResourceType(service: string, resourcePart: string): string {
    const resourceTypeMappings: Record<string, Record<string, string>> = {
      'ec2': {
        'instance': 'EC2::Instance',
        'volume': 'EC2::Volume',
        'security-group': 'EC2::SecurityGroup',
        'vpc': 'EC2::VPC',
        'subnet': 'EC2::Subnet',
        'internet-gateway': 'EC2::InternetGateway',
        'route-table': 'EC2::RouteTable',
        'network-acl': 'EC2::NetworkAcl',
        'elastic-ip': 'EC2::ElasticIP',
        'nat-gateway': 'EC2::NatGateway',
        'transit-gateway': 'EC2::TransitGateway',
        'launch-template': 'EC2::LaunchTemplate',
        'key-pair': 'EC2::KeyPair',
        'snapshot': 'EC2::Snapshot',
        'image': 'EC2::Image',
      },
      'rds': {
        'db': 'RDS::DBInstance',
        'cluster': 'RDS::DBCluster',
        'subnet-group': 'RDS::DBSubnetGroup',
        'parameter-group': 'RDS::DBParameterGroup',
        'snapshot': 'RDS::DBSnapshot',
      },
      's3': {
        'bucket': 'S3::Bucket',
      },
      'lambda': {
        'function': 'Lambda::Function',
      },
      'ecs': {
        'cluster': 'ECS::Cluster',
        'service': 'ECS::Service',
        'task-definition': 'ECS::TaskDefinition',
        'container-instance': 'ECS::ContainerInstance',
      },
      'dynamodb': {
        'table': 'DynamoDB::Table',
      },
      'sns': {
        'topic': 'SNS::Topic',
      },
      'sqs': {
        'queue': 'SQS::Queue',
      },
      'elasticloadbalancing': {
        'loadbalancer': 'ELB::LoadBalancer',
        'targetgroup': 'ELB::TargetGroup',
      },
      'iam': {
        'role': 'IAM::Role',
        'user': 'IAM::User',
        'group': 'IAM::Group',
        'policy': 'IAM::Policy',
      },
      'logs': {
        'log-group': 'CloudWatchLogs::LogGroup',
      },
      'cloudwatch': {
        'alarm': 'CloudWatch::Alarm',
      },
      'kinesis': {
        'stream': 'Kinesis::Stream',
      },
      'elasticsearch': {
        'domain': 'OpenSearch::Domain',
      },
      'opensearch': {
        'domain': 'OpenSearch::Domain',
      },
      'kafka': {
        'cluster': 'MSK::Cluster',
      },
      'redshift': {
        'cluster': 'Redshift::Cluster',
      },
      'elasticache': {
        'cluster': 'ElastiCache::Cluster',
        'replication-group': 'ElastiCache::ReplicationGroup',
      },
      'apigateway': {
        'restapi': 'APIGateway::RestApi',
        'stage': 'APIGateway::Stage',
      },
      'route53': {
        'hostedzone': 'Route53::HostedZone',
      },
      'cloudfront': {
        'distribution': 'CloudFront::Distribution',
      },
      'secretsmanager': {
        'secret': 'SecretsManager::Secret',
      },
      'ssm': {
        'parameter': 'SSM::Parameter',
        'document': 'SSM::Document',
      },
      'glue': {
        'database': 'Glue::Database',
        'table': 'Glue::Table',
        'job': 'Glue::Job',
        'crawler': 'Glue::Crawler',
      },
      'stepfunctions': {
        'statemachine': 'StepFunctions::StateMachine',
      },
      'batch': {
        'job-queue': 'Batch::JobQueue',
        'job-definition': 'Batch::JobDefinition',
        'compute-environment': 'Batch::ComputeEnvironment',
      },
      'efs': {
        'file-system': 'EFS::FileSystem',
      },
      'eks': {
        'cluster': 'EKS::Cluster',
        'nodegroup': 'EKS::NodeGroup',
      },
      'ecr': {
        'repository': 'ECR::Repository',
      },
    };

    const resourceTypeKey = resourcePart.split('/')[0];
    const serviceMapping = resourceTypeMappings[service];
    
    if (serviceMapping && serviceMapping[resourceTypeKey]) {
      return serviceMapping[resourceTypeKey];
    }

    // Fallback to a generic format
    return `${service.toUpperCase()}::${resourceTypeKey.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')}`;
  }

  private extractNameFromARN(arn: string): string | undefined {
    try {
      const arnParts = arn.split(':');
      if (arnParts.length >= 6) {
        const resourcePart = arnParts[5];
        const resourceSegments = resourcePart.split('/');
        
        // Return the last segment as the name (most specific identifier)
        return resourceSegments[resourceSegments.length - 1];
      }
    } catch (error) {
      console.warn(`Error extracting name from ARN ${arn}:`, error);
    }
    return undefined;
  }

  private async storeDiscoveredResources(resources: DiscoveredResource[]): Promise<void> {
    console.log(`Storing ${resources.length} discovered resources...`);
    
    for (const resource of resources) {
      try {
        // Check if resource already exists
        const existing = await db
          .select()
          .from(awsDiscoveredResources)
          .where(eq(awsDiscoveredResources.arn, resource.arn))
          .limit(1);

        if (existing.length > 0) {
          // Update existing resource
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
          // Insert new resource
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
        // Continue with other resources even if one fails
      }
    }
    
    console.log('Finished storing discovered resources');
  }

  private async enrichWithOperationalStatus(resources: DiscoveredResource[]): Promise<void> {
    console.log('Enriching resources with operational status...');
    
    for (const resource of resources) {
      try {
        switch (resource.resourceType) {
          case 'EC2::Instance':
            await this.enrichEC2Instance(resource);
            break;
          case 'RDS::DBInstance':
            await this.enrichRDSInstance(resource);
            break;
          case 'RDS::DBCluster':
            await this.enrichRDSCluster(resource);
            break;
          case 'Lambda::Function':
            await this.enrichLambdaFunction(resource);
            break;
          case 'ECS::Service':
            await this.enrichECSService(resource);
            break;
          case 'ELB::LoadBalancer':
            await this.enrichLoadBalancer(resource);
            break;
          default:
            // For unsupported resource types, set basic status
            resource.resourceState = 'discovered';
            resource.healthStatus = 'unknown';
            resource.isActive = true;
        }
        resource.statusDetails = resource.statusDetails || {};
        resource.statusDetails.lastEnriched = new Date().toISOString();
      } catch (error) {
        console.warn(`Error enriching resource ${resource.arn}:`, error);
        resource.resourceState = 'error';
        resource.healthStatus = 'unknown';
        resource.isActive = false;
        resource.statusDetails = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  }

  private async enrichEC2Instance(resource: DiscoveredResource): Promise<void> {
    const instanceId = this.extractResourceId(resource.arn, 'instance');
    if (!instanceId) return;

    const ec2Client = new EC2Client({
      credentials: this.credentials,
      region: resource.awsRegion,
    });

    try {
      // Get instance details
      const instancesResponse = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));

      const instance = instancesResponse.Reservations?.[0]?.Instances?.[0];
      if (instance) {
        resource.resourceState = instance.State?.Name || 'unknown';
        resource.isActive = instance.State?.Name === 'running';
        
        // Get instance status
        const statusResponse = await ec2Client.send(new DescribeInstanceStatusCommand({
          InstanceIds: [instanceId]
        }));

        const status = statusResponse.InstanceStatuses?.[0];
        if (status) {
          const systemStatus = status.SystemStatus?.Status;
          const instanceStatus = status.InstanceStatus?.Status;
          
          resource.healthStatus = (systemStatus === 'ok' && instanceStatus === 'ok') ? 'healthy' : 'unhealthy';
          resource.statusDetails = {
            systemStatus,
            instanceStatus,
            instanceType: instance.InstanceType,
            platform: instance.Platform || 'linux',
            publicIp: instance.PublicIpAddress,
            privateIp: instance.PrivateIpAddress,
            availabilityZone: instance.Placement?.AvailabilityZone,
          };
        } else {
          resource.healthStatus = resource.isActive ? 'healthy' : 'unknown';
        }
      }
    } catch (error) {
      console.warn(`Error enriching EC2 instance ${instanceId}:`, error);
      throw error;
    }
  }

  private async enrichRDSInstance(resource: DiscoveredResource): Promise<void> {
    const dbInstanceId = this.extractResourceId(resource.arn, 'db');
    console.log(`RDS Instance - ARN: ${resource.arn}, Extracted ID: ${dbInstanceId}`);
    if (!dbInstanceId) return;

    const rdsClient = new RDSClient({
      credentials: this.credentials,
      region: resource.awsRegion,
    });

    try {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      }));

      const dbInstance = response.DBInstances?.[0];
      if (dbInstance) {
        resource.resourceState = dbInstance.DBInstanceStatus || 'unknown';
        resource.isActive = dbInstance.DBInstanceStatus === 'available';
        resource.healthStatus = dbInstance.DBInstanceStatus === 'available' ? 'healthy' : 'unhealthy';
        
        resource.statusDetails = {
          engine: dbInstance.Engine,
          engineVersion: dbInstance.EngineVersion,
          instanceClass: dbInstance.DBInstanceClass,
          multiAZ: dbInstance.MultiAZ,
          publiclyAccessible: dbInstance.PubliclyAccessible,
          storageType: dbInstance.StorageType,
          allocatedStorage: dbInstance.AllocatedStorage,
          endpoint: dbInstance.Endpoint?.Address,
          port: dbInstance.Endpoint?.Port,
          availabilityZone: dbInstance.AvailabilityZone,
        };

        resource.operationalMetrics = {
          storageEncrypted: dbInstance.StorageEncrypted,
          backupRetentionPeriod: dbInstance.BackupRetentionPeriod,
          deletionProtection: dbInstance.DeletionProtection,
        };
      }
    } catch (error) {
      console.warn(`Error enriching RDS instance ${dbInstanceId}:`, error);
      throw error;
    }
  }

  private async enrichRDSCluster(resource: DiscoveredResource): Promise<void> {
    const dbClusterId = this.extractResourceId(resource.arn, 'cluster');
    console.log(`RDS Cluster - ARN: ${resource.arn}, Extracted ID: ${dbClusterId}`);
    if (!dbClusterId) return;

    const rdsClient = new RDSClient({
      credentials: this.credentials,
      region: resource.awsRegion,
    });

    try {
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: dbClusterId
      }));

      const dbCluster = response.DBClusters?.[0];
      if (dbCluster) {
        resource.resourceState = dbCluster.Status || 'unknown';
        resource.isActive = dbCluster.Status === 'available';
        resource.healthStatus = dbCluster.Status === 'available' ? 'healthy' : 'unhealthy';
        
        resource.statusDetails = {
          engine: dbCluster.Engine,
          engineVersion: dbCluster.EngineVersion,
          masterUsername: dbCluster.MasterUsername,
          multiAZ: dbCluster.MultiAZ,
          readerEndpoint: dbCluster.ReaderEndpoint,
          endpoint: dbCluster.Endpoint,
          port: dbCluster.Port,
          clusterMembers: dbCluster.DBClusterMembers?.length || 0,
        };

        resource.operationalMetrics = {
          storageEncrypted: dbCluster.StorageEncrypted,
          backupRetentionPeriod: dbCluster.BackupRetentionPeriod,
          deletionProtection: dbCluster.DeletionProtection,
        };
      }
    } catch (error) {
      console.warn(`Error enriching RDS cluster ${dbClusterId}:`, error);
      throw error;
    }
  }

  private async enrichLambdaFunction(resource: DiscoveredResource): Promise<void> {
    const functionName = this.extractResourceId(resource.arn, 'function');
    if (!functionName) return;

    const lambdaClient = new LambdaClient({
      credentials: this.credentials,
      region: resource.awsRegion,
    });

    try {
      const configResponse = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: functionName
      }));

      if (configResponse) {
        resource.resourceState = configResponse.State || 'unknown';
        resource.isActive = configResponse.State === 'Active';
        resource.healthStatus = configResponse.State === 'Active' ? 'healthy' : 'unhealthy';
        
        resource.statusDetails = {
          runtime: configResponse.Runtime,
          timeout: configResponse.Timeout,
          memorySize: configResponse.MemorySize,
          codeSize: configResponse.CodeSize,
          lastModified: configResponse.LastModified,
          version: configResponse.Version,
          architecture: configResponse.Architectures?.[0],
        };

        resource.operationalMetrics = {
          lastUpdateStatus: configResponse.LastUpdateStatus,
          packageType: configResponse.PackageType,
          environment: configResponse.Environment?.Variables ? Object.keys(configResponse.Environment.Variables).length : 0,
        };
      }
    } catch (error) {
      console.warn(`Error enriching Lambda function ${functionName}:`, error);
      throw error;
    }
  }

  private async enrichECSService(resource: DiscoveredResource): Promise<void> {
    const serviceArn = resource.arn;
    const clusterName = this.extractClusterFromServiceArn(serviceArn);
    const serviceName = this.extractResourceId(serviceArn, 'service');
    
    if (!clusterName || !serviceName) return;

    const ecsClient = new ECSClient({
      credentials: this.credentials,
      region: resource.awsRegion,
    });

    try {
      const response = await ecsClient.send(new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName]
      }));

      const service = response.services?.[0];
      if (service) {
        resource.resourceState = service.status || 'unknown';
        resource.isActive = service.status === 'ACTIVE';
        
        const runningCount = service.runningCount || 0;
        const desiredCount = service.desiredCount || 0;
        resource.healthStatus = runningCount === desiredCount && runningCount > 0 ? 'healthy' : 'unhealthy';
        
        resource.statusDetails = {
          taskDefinition: service.taskDefinition,
          clusterArn: service.clusterArn,
          launchType: service.launchType,
          platform: service.platformVersion,
          createdAt: service.createdAt?.toISOString(),
        };

        resource.operationalMetrics = {
          runningCount,
          desiredCount,
          pendingCount: service.pendingCount || 0,
          healthCheckGracePeriodSeconds: service.healthCheckGracePeriodSeconds,
        };
      }
    } catch (error) {
      console.warn(`Error enriching ECS service ${serviceName}:`, error);
      throw error;
    }
  }

  private async enrichLoadBalancer(resource: DiscoveredResource): Promise<void> {
    const lbArn = resource.arn;
    
    const elbClient = new ElasticLoadBalancingV2Client({
      credentials: this.credentials,
      region: resource.awsRegion,
    });

    try {
      const response = await elbClient.send(new DescribeLoadBalancersCommand({
        LoadBalancerArns: [lbArn]
      }));

      const loadBalancer = response.LoadBalancers?.[0];
      if (loadBalancer) {
        resource.resourceState = loadBalancer.State?.Code || 'unknown';
        resource.isActive = loadBalancer.State?.Code === 'active';
        resource.healthStatus = loadBalancer.State?.Code === 'active' ? 'healthy' : 'unhealthy';
        
        resource.statusDetails = {
          type: loadBalancer.Type,
          scheme: loadBalancer.Scheme,
          ipAddressType: loadBalancer.IpAddressType,
          dnsName: loadBalancer.DNSName,
          canonicalHostedZoneId: loadBalancer.CanonicalHostedZoneId,
          createdTime: loadBalancer.CreatedTime?.toISOString(),
          availabilityZones: loadBalancer.AvailabilityZones?.map(az => az.ZoneName),
        };

        // Get target groups for additional health info
        try {
          const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({
            LoadBalancerArn: lbArn
          }));
          
          resource.operationalMetrics = {
            targetGroupCount: tgResponse.TargetGroups?.length || 0,
            securityGroups: loadBalancer.SecurityGroups?.length || 0,
          };
        } catch (tgError) {
          // Target group info is optional
          resource.operationalMetrics = {
            securityGroups: loadBalancer.SecurityGroups?.length || 0,
          };
        }
      }
    } catch (error) {
      console.warn(`Error enriching Load Balancer ${lbArn}:`, error);
      throw error;
    }
  }

  private extractResourceId(arn: string, resourceType: string): string | null {
    try {
      const arnParts = arn.split(':');
      if (arnParts.length < 6) return null;
      
      const resourcePart = arnParts[5];
      
      // Handle different ARN formats
      if (resourceType === 'instance' && resourcePart.includes('/')) {
        return resourcePart.split('/')[1]; // instance/i-1234567890abcdef0
      } else if (resourceType === 'function') {
        // Lambda ARN: arn:aws:lambda:region:account:function:function-name
        return arnParts[6]; // function name is in the 7th part (index 6)
      } else if (resourceType === 'db' || resourceType === 'cluster') {
        // RDS ARN: arn:aws:rds:region:account:db:instance-name or arn:aws:rds:region:account:cluster:cluster-name
        return arnParts[6]; // DB identifier is in the 7th part (index 6)
      } else if (resourceType === 'service') {
        // ECS Service ARN: arn:aws:ecs:region:account:service/cluster-name/service-name
        const parts = resourcePart.split('/');
        return parts[parts.length - 1]; // service name is the last part
      } else if (resourcePart.includes('/')) {
        return resourcePart.split('/')[1]; // general format with slash
      } else if (resourcePart.includes(':')) {
        return resourcePart.split(':')[1]; // general format with colon
      }
      
      return resourcePart;
    } catch (error) {
      console.warn(`Error extracting resource ID from ARN ${arn}:`, error);
      return null;
    }
  }

  private extractClusterFromServiceArn(serviceArn: string): string | null {
    try {
      // ECS Service ARN format: arn:aws:ecs:region:account:service/cluster-name/service-name
      const arnParts = serviceArn.split(':');
      if (arnParts.length < 6) return null;
      
      const resourcePart = arnParts[5];
      const parts = resourcePart.split('/');
      if (parts.length >= 3 && parts[0] === 'service') {
        return parts[1]; // cluster name
      }
      
      return null;
    } catch (error) {
      console.warn(`Error extracting cluster from service ARN ${serviceArn}:`, error);
      return null;
    }
  }
} 
