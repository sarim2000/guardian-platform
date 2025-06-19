import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

/**
 * AWS_ACCOUNTS TABLE
 * Stores multiple AWS account credentials and configurations
 */
export const awsAccounts = pgTable('aws_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountName: text('account_name').notNull(), // Human-readable name (e.g., "Production", "Development")
  accountId: text('account_id').notNull(), // AWS Account ID
  accessKeyId: text('access_key_id').notNull(), // Encrypted AWS Access Key
  secretAccessKey: text('secret_access_key').notNull(), // Encrypted AWS Secret Key
  defaultRegion: text('default_region').notNull().default('us-east-1'),
  regions: text('regions').array(), // Array of regions to scan
  isActive: boolean('is_active').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false), // Primary account for discovery

  // Optional metadata
  description: text('description'),
  organizationRole: text('organization_role'), // e.g., "production", "staging", "development"

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastUsed: timestamp('last_used', { withTimezone: true }),
}, (table) => [
  index('idx_aws_accounts_account_id').on(table.accountId),
  index('idx_aws_accounts_active').on(table.isActive),
  index('idx_aws_accounts_default').on(table.isDefault),
]).enableRLS(); 
