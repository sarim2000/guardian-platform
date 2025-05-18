import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  boolean,
  primaryKey,
  index,
  pgEnum // Optional: if you want to use enums for fields like lifecycle, tier, etc.
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Optional: Define enums if you want DB-level constraints
export const lifecycleEnum = pgEnum('lifecycle', ['development', 'beta', 'production', 'deprecated', 'retired']);
export const tierEnum = pgEnum('tier', ['tier1', 'tier2', 'tier3', 'tier4']);
export const serviceTypeEnum = pgEnum('service_type', ['api', 'frontend', 'worker', 'cronjob', 'database', 'library']);

/**
 * SERVICES TABLE
 * Stores information parsed from guardian-manifest.yaml (Service kind)
 */
export const services = pgTable('services', {
  // Core Guardian Fields
  id: uuid('id').defaultRandom().primaryKey(), // Guardian's internal ID
  externalRepoId: text('external_repo_id').notNull(), // Git provider's unique ID for the repo
  gitProvider: text('git_provider').notNull(), // e.g., 'github'
  organizationName: text('organization_name').notNull(),
  repositoryName: text('repository_name').notNull(),
  manifestPath: text('manifest_path').notNull(), // path to the manifest file

  // From Manifest metadata
  serviceName: text('service_name').notNull(), // from metadata.name
  displayName: text('display_name'),           // optional, from metadata.displayName
  description: text('description'),            // optional, from metadata.description
  annotations: jsonb('annotations'),           // optional, from metadata.annotations (stores as JSON)

  // From Manifest spec
  ownerTeam: text('owner_team').notNull(),             // from spec.owner.team
  ownerEmail: text('owner_email'),                     // optional, from spec.owner.email
  lifecycle: text('lifecycle').notNull(),              // from spec.lifecycle (or use lifecycleEnum)
  tier: text('tier'),                                  // optional, from spec.tier (or use tierEnum)
  serviceType: text('service_type'),                   // optional, from spec.type (or use serviceTypeEnum)
  partOf: text('part_of'),                             // optional, from spec.partOf
  dependencies: jsonb('dependencies'),                 // optional, from spec.dependencies (stores array of objects as JSON)
  techStack: text('tech_stack').array(),               // optional, from spec.techStack (stores array of strings)
  links: jsonb('links'),                               // optional, from spec.links (stores array of objects as JSON)
  defaultChecklistTemplateId: text('default_checklist_template_id'), // optional, FK to checklist_templates.id

  // Guardian-specific fields
  rawManifestData: jsonb('raw_manifest_data').notNull(), // store the complete parsed manifest as JSON
  guardianRemarks: text('guardian_remarks'),             // optional, for any notes Guardian might add

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(), // You might want an ON UPDATE trigger or handle this in code
  lastIngestedAt: timestamp('last_ingested_at', { withTimezone: true }),
}, (table) => {
  return {
    // Example indexes
    idxServiceName: index('idx_service_name').on(table.serviceName),
    idxOwnerTeam: index('idx_owner_team').on(table.ownerTeam),
    idxLifecycle: index('idx_lifecycle').on(table.lifecycle),
    idxExternalRepo: index('idx_external_repo').on(table.externalRepoId, table.gitProvider), // For unique identification of repo
    // Add other indexes as needed for your query patterns
  };
}).enableRLS();

/**
 * CHECKLIST TEMPLATES TABLE
 * Stores information parsed from ChecklistTemplate YAMLs
 * Referenced by services.defaultChecklistTemplateId
 */
export const checklistTemplates = pgTable('checklist_templates', {
  // The 'metadata.name' from the ChecklistTemplate YAML (e.g., "basic-prod-readiness-v1")
  // This is the ID referenced by services.defaultChecklistTemplateId
  id: text('id').primaryKey(),
  displayName: text('display_name'),        // optional, from metadata.displayName
  description: text('description'),         // optional, from metadata.description
  labels: jsonb('labels'),                  // optional, from metadata.labels (stores as JSON)
  sections: jsonb('sections').notNull(),    // Core content: array of sections, each with items (stores as JSON)
  // Example structure for an item within sections:
  // { id: "MON-001", description: "...", severity: "critical", expectedEvidence: "..." }

  rawTemplateData: jsonb('raw_template_data').notNull(), // store the complete parsed template as JSON

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

// Define relationships (optional for MVP if you're just storing the ID string,
// but good for future ORM use if you build out the checklist engine)
export const servicesRelations = relations(services, ({ one }) => ({
  // Example: If you want to fetch the template object directly via Drizzle
  // This assumes defaultChecklistTemplateId in 'services' matches an 'id' in 'checklistTemplates'
  // For this to work as a true foreign key, 'defaultChecklistTemplateId' should not be nullable
  // or you handle nullable relations carefully.
  // For MVP, you might just query checklistTemplates separately using the ID.
  // checklistTemplate: one(checklistTemplates, {
  //   fields: [services.defaultChecklistTemplateId],
  //   references: [checklistTemplates.id],
  // }),
}));

// If checklistTemplates can be used by many services (many-to-one from service to template)
// export const checklistTemplatesRelations = relations(checklistTemplates, ({ many }) => ({
//  services: many(services),
// }));
