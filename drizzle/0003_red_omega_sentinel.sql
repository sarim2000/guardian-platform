CREATE TABLE "aws_discovered_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"arn" text NOT NULL,
	"aws_account_id" text NOT NULL,
	"aws_region" text NOT NULL,
	"resource_type" text NOT NULL,
	"name_tag" text,
	"all_tags" jsonb,
	"raw_metadata" jsonb NOT NULL,
	"first_discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "aws_discovered_resources_arn_unique" UNIQUE("arn")
);
--> statement-breakpoint
ALTER TABLE "aws_discovered_resources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_aws_resources_arn" ON "aws_discovered_resources" USING btree ("arn");--> statement-breakpoint
CREATE INDEX "idx_aws_resources_type" ON "aws_discovered_resources" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_aws_resources_region" ON "aws_discovered_resources" USING btree ("aws_region");--> statement-breakpoint
CREATE INDEX "idx_aws_resources_account" ON "aws_discovered_resources" USING btree ("aws_account_id");