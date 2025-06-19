import React, { ReactElement } from 'react';
import {
  IconServer,
  IconDatabase,
  IconFunction,
  IconContainer,
  IconScale,
  IconCloud,
  IconCircleCheck,
  IconCircleX,
  IconCircleDot,
} from '@tabler/icons-react';

/**
 * Get color theme for AWS resource types
 */
export const getResourceTypeColor = (type: string): string => {
  const service = type.split('::')[0];
  switch (service) {
    case 'EC2': return 'blue';
    case 'RDS': return 'purple';
    case 'S3': return 'green';
    case 'Lambda': return 'orange';
    case 'ECS': return 'cyan';
    case 'DynamoDB': return 'yellow';
    case 'SNS': return 'pink';
    case 'SQS': return 'lime';
    case 'ELB': return 'indigo';
    case 'IAM': return 'red';
    case 'CloudWatchLogs':
    case 'CloudWatch': return 'teal';
    case 'Kinesis': return 'violet';
    case 'OpenSearch': return 'grape';
    case 'MSK': return 'dark';
    case 'Redshift': return 'blue';
    case 'ElastiCache': return 'red';
    case 'APIGateway': return 'green';
    case 'Route53': return 'orange';
    case 'CloudFront': return 'cyan';
    case 'SecretsManager': return 'pink';
    case 'SSM': return 'gray';
    case 'Glue': return 'yellow';
    case 'StepFunctions': return 'indigo';
    case 'Batch': return 'lime';
    case 'EFS': return 'teal';
    case 'EKS': return 'violet';
    case 'ECR': return 'grape';
    default: return 'gray';
  }
};

/**
 * Get appropriate icon for AWS resource types
 */
export const getResourceTypeIcon = (type: string, size: number = 16): ReactElement => {
  const service = type.split('::')[0];
  
  switch (service) {
    case 'EC2': return <IconServer size={size} />;
    case 'RDS': return <IconDatabase size={size} />;
    case 'Lambda': return <IconFunction size={size} />;
    case 'ECS': return <IconContainer size={size} />;
    case 'ELB': return <IconScale size={size} />;
    default: return <IconCloud size={size} />;
  }
};

/**
 * Get health status icon based on status string
 */
export const getHealthStatusIcon = (status?: string, size: number = 16): ReactElement => {
  switch (status) {
    case 'healthy':
      return <IconCircleCheck size={size} color="green" />;
    case 'unhealthy':
      return <IconCircleX size={size} color="red" />;
    case 'unknown':
    default:
      return <IconCircleDot size={size} color="gray" />;
  }
};

/**
 * Get color for resource state based on operational status
 */
export const getResourceStateColor = (state?: string): string => {
  if (!state) return 'gray';
  
  const activeStates = ['running', 'available', 'active', 'Active'];
  const inactiveStates = ['stopped', 'stopping', 'pending', 'terminated'];
  const warningStates = ['starting', 'pending', 'stopping'];
  
  if (activeStates.includes(state)) return 'green';
  if (inactiveStates.includes(state)) return 'red';
  if (warningStates.includes(state)) return 'yellow';
  return 'gray';
};

/**
 * AWS regions list
 */
export const AWS_REGIONS = [
  'us-east-1', 'us-west-1', 'us-west-2', 'us-east-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1',
  'ca-central-1', 'sa-east-1', 'af-south-1', 'me-south-1'
];

/**
 * AWS resource types list
 */
export const AWS_RESOURCE_TYPES = [
  'EC2::Instance', 'EC2::Volume', 'EC2::SecurityGroup', 'EC2::VPC', 'EC2::Subnet',
  'RDS::DBInstance', 'RDS::DBCluster', 'S3::Bucket', 'Lambda::Function',
  'ECS::Cluster', 'ECS::Service', 'ECS::TaskDefinition', 'DynamoDB::Table',
  'SNS::Topic', 'SQS::Queue', 'ELB::LoadBalancer', 'ELB::TargetGroup',
  'IAM::Role', 'IAM::User', 'CloudWatchLogs::LogGroup', 'CloudWatch::Alarm',
  'Kinesis::Stream', 'OpenSearch::Domain', 'MSK::Cluster', 'Redshift::Cluster',
  'ElastiCache::Cluster', 'APIGateway::RestApi', 'Route53::HostedZone',
  'CloudFront::Distribution', 'SecretsManager::Secret', 'SSM::Parameter',
  'Glue::Database', 'Glue::Job', 'StepFunctions::StateMachine', 'Batch::JobQueue',
  'EFS::FileSystem', 'EKS::Cluster', 'ECR::Repository'
];

/**
 * Health status options
 */
export const HEALTH_STATUSES = ['healthy', 'unhealthy', 'unknown'];

/**
 * Extract common status details from AWS resource
 */
export const extractStatusDetails = (statusDetails?: Record<string, any>) => {
  if (!statusDetails) return [];

  const items: Array<{ label: string; value: any }> = [];

  // Common details mapping
  const detailMappings = [
    { key: 'instanceType', label: 'Instance Type' },
    { key: 'engine', label: 'Engine', formatter: (value: any, details: any) => 
      `${value} ${details.engineVersion || ''}`.trim() },
    { key: 'runtime', label: 'Runtime' },
    { key: 'memorySize', label: 'Memory', formatter: (value: any) => `${value} MB` },
    { key: 'timeout', label: 'Timeout', formatter: (value: any) => `${value}s` },
    { key: 'availabilityZone', label: 'AZ' },
    { key: 'multiAZ', label: 'Multi-AZ', formatter: (value: any) => value ? 'Yes' : 'No' },
  ];

  detailMappings.forEach(({ key, label, formatter }) => {
    if (statusDetails[key] !== undefined) {
      const value = formatter 
        ? formatter(statusDetails[key], statusDetails)
        : statusDetails[key];
      items.push({ label, value });
    }
  });

  return items;
};

/**
 * Extract operational metrics for display
 */
export const extractOperationalMetrics = (operationalMetrics?: Record<string, any>) => {
  if (!operationalMetrics) return [];

  const metrics = operationalMetrics;
  const items: Array<{ type: string; key: string; label: string; value: string; percentage?: number }> = [];

  // ECS Service metrics
  if (metrics.runningCount !== undefined && metrics.desiredCount !== undefined) {
    const percentage = metrics.desiredCount > 0 
      ? (metrics.runningCount / metrics.desiredCount) * 100 
      : 0;
    items.push({
      type: 'progress',
      key: 'ecs-tasks',
      label: 'Task Health',
      value: `${metrics.runningCount}/${metrics.desiredCount}`,
      percentage
    });
  }

  // RDS metrics
  if (metrics.backupRetentionPeriod !== undefined) {
    items.push({
      type: 'text',
      key: 'backup',
      label: 'Backup Retention',
      value: `${metrics.backupRetentionPeriod} days`
    });
  }

  // Lambda metrics
  if (metrics.environment !== undefined) {
    items.push({
      type: 'text',
      key: 'env-vars',
      label: 'Environment Variables',
      value: `${metrics.environment} variables`
    });
  }

  return items;
}; 
