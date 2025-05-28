import { 
  ResourceGroupsTaggingAPIClient, 
  GetResourcesCommand
} from '@aws-sdk/client-resource-groups-tagging-api';
import { db, awsDiscoveredResources } from '@/db';
import { eq } from 'drizzle-orm';
import env from '@/utils/env';

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

interface DiscoveredResource {
  arn: string;
  awsAccountId: string;
  awsRegion: string;
  resourceType: string;
  nameTag?: string;
  allTags: Record<string, string>;
  rawMetadata: any;
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

  constructor() {
    this.credentials = {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
    };
    this.regions = env.AWS_REGIONS;

    if (!this.credentials.accessKeyId || !this.credentials.secretAccessKey) {
      throw new Error('AWS credentials not found in environment variables');
    }
  }

  async discoverResources(): Promise<DiscoveredResource[]> {
    const discoveredResources: DiscoveredResource[] = [];

    try {
      console.log(`Starting AWS resource discovery across ${this.regions.length} regions...`);
      
      // Use Resource Groups Tagging API for comprehensive resource discovery
      const taggingResources = await this.discoverResourcesWithTaggingAPI();
      discoveredResources.push(...taggingResources);

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
              nameTag: resource.nameTag,
              allTags: resource.allTags,
              rawMetadata: resource.rawMetadata,
              lastSeenAt: new Date(),
            })
            .where(eq(awsDiscoveredResources.arn, resource.arn));
        } else {
          // Insert new resource
          await db.insert(awsDiscoveredResources).values({
            arn: resource.arn,
            awsAccountId: resource.awsAccountId,
            awsRegion: resource.awsRegion,
            resourceType: resource.resourceType,
            nameTag: resource.nameTag,
            allTags: resource.allTags,
            rawMetadata: resource.rawMetadata,
          });
        }
      } catch (error) {
        console.error(`Error storing resource ${resource.arn}:`, error);
        // Continue with other resources even if one fails
      }
    }
    
    console.log('Finished storing discovered resources');
  }
} 
