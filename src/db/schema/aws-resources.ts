import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

/**
 * AWS_DISCOVERED_RESOURCES TABLE
 * Stores AWS resources discovered through the resource discovery process
 */
export const awsDiscoveredResources = pgTable('aws_discovered_resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  arn: text('arn').notNull().unique(), // AWS ARN as unique identifier
  awsAccountId: text('aws_account_id').notNull(),
  awsRegion: text('aws_region').notNull(),
  resourceType: text('resource_type').notNull(), // e.g., 'EC2::Instance', 'S3::Bucket', 'Lambda::Function'
  nameTag: text('name_tag'), // Value of the 'Name' tag if present
  allTags: jsonb('all_tags'), // All AWS tags as JSON
  rawMetadata: jsonb('raw_metadata').notNull(), // Complete AWS API response as JSON
  
  // Timestamps
  firstDiscoveredAt: timestamp('first_discovered_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    idxArn: index('idx_aws_resources_arn').on(table.arn),
    idxResourceType: index('idx_aws_resources_type').on(table.resourceType),
    idxRegion: index('idx_aws_resources_region').on(table.awsRegion),
    idxAccountId: index('idx_aws_resources_account').on(table.awsAccountId),
  };
}).enableRLS(); 
