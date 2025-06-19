import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
  boolean,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { awsAccounts } from './aws-accounts';

/**
 * AWS_DISCOVERED_RESOURCES TABLE
 * Stores AWS resources discovered through the resource discovery process
 */
export const awsDiscoveredResources = pgTable('aws_discovered_resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  arn: text('arn').notNull().unique(), // AWS ARN as unique identifier
  awsAccountConfigId: uuid('aws_account_config_id'), // Foreign key to aws_accounts table (optional for backward compatibility)
  awsAccountId: text('aws_account_id').notNull(), // AWS Account ID (12-digit number)
  awsRegion: text('aws_region').notNull(),
  resourceType: text('resource_type').notNull(), // e.g., 'EC2::Instance', 'S3::Bucket', 'Lambda::Function'
  nameTag: text('name_tag'), // Value of the 'Name' tag if present
  allTags: jsonb('all_tags'), // All AWS tags as JSON
  rawMetadata: jsonb('raw_metadata').notNull(), // Complete AWS API response as JSON
  
  // Operational Status Fields
  resourceState: text('resource_state'), // e.g., 'running', 'stopped', 'available', 'pending'
  healthStatus: text('health_status'), // e.g., 'healthy', 'unhealthy', 'unknown'
  isActive: boolean('is_active'), // Quick boolean for active/inactive state
  operationalMetrics: jsonb('operational_metrics'), // Additional metrics like CPU, memory, etc.
  statusDetails: jsonb('status_details'), // Detailed status information specific to resource type
  
  // Timestamps
  firstDiscoveredAt: timestamp('first_discovered_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  statusLastChecked: timestamp('status_last_checked', { withTimezone: true }), // When status was last verified
}, (table) => ([
  index('idx_aws_resources_arn').on(table.arn),
  index('idx_aws_resources_type').on(table.resourceType),
  index('idx_aws_resources_region').on(table.awsRegion),
  index('idx_aws_resources_account_config').on(table.awsAccountConfigId),
  index('idx_aws_resources_account').on(table.awsAccountId),
  index('idx_aws_resources_state').on(table.resourceState),
  index('idx_aws_resources_health').on(table.healthStatus),
  index('idx_aws_resources_active').on(table.isActive),
  
  // Foreign key constraint (nullable for backward compatibility)
  foreignKey({
    columns: [table.awsAccountConfigId],
    foreignColumns: [awsAccounts.id],
    name: 'fk_aws_resources_account_config'
  }).onDelete('set null'),
])); 
