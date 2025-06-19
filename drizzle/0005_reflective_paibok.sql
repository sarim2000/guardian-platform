ALTER TABLE "aws_discovered_resources" ADD COLUMN "resource_state" text;--> statement-breakpoint
ALTER TABLE "aws_discovered_resources" ADD COLUMN "health_status" text;--> statement-breakpoint
ALTER TABLE "aws_discovered_resources" ADD COLUMN "is_active" boolean;--> statement-breakpoint
ALTER TABLE "aws_discovered_resources" ADD COLUMN "operational_metrics" jsonb;--> statement-breakpoint
ALTER TABLE "aws_discovered_resources" ADD COLUMN "status_details" jsonb;--> statement-breakpoint
ALTER TABLE "aws_discovered_resources" ADD COLUMN "status_last_checked" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_aws_resources_state" ON "aws_discovered_resources" USING btree ("resource_state");--> statement-breakpoint
CREATE INDEX "idx_aws_resources_health" ON "aws_discovered_resources" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "idx_aws_resources_active" ON "aws_discovered_resources" USING btree ("is_active");