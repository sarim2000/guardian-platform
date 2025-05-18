CREATE TYPE "public"."lifecycle" AS ENUM('development', 'beta', 'production', 'deprecated', 'retired');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('api', 'frontend', 'worker', 'cronjob', 'database', 'library');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('tier1', 'tier2', 'tier3', 'tier4');--> statement-breakpoint
CREATE TABLE "checklist_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"description" text,
	"labels" jsonb,
	"sections" jsonb NOT NULL,
	"raw_template_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_repo_id" text NOT NULL,
	"git_provider" text NOT NULL,
	"organization_name" text NOT NULL,
	"repository_name" text NOT NULL,
	"manifest_path" text NOT NULL,
	"service_name" text NOT NULL,
	"display_name" text,
	"description" text,
	"annotations" jsonb,
	"owner_team" text NOT NULL,
	"owner_email" text,
	"lifecycle" text NOT NULL,
	"tier" text,
	"service_type" text,
	"part_of" text,
	"dependencies" jsonb,
	"tech_stack" text[],
	"links" jsonb,
	"default_checklist_template_id" text,
	"raw_manifest_data" jsonb NOT NULL,
	"guardian_remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_ingested_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "idx_service_name" ON "services" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "idx_owner_team" ON "services" USING btree ("owner_team");--> statement-breakpoint
CREATE INDEX "idx_lifecycle" ON "services" USING btree ("lifecycle");--> statement-breakpoint
CREATE INDEX "idx_external_repo" ON "services" USING btree ("external_repo_id","git_provider");