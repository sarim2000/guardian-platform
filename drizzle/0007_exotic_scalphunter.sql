ALTER TABLE "aws_discovered_resources" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "aws_discovered_resources" ADD COLUMN "aws_account_config_id" uuid;--> statement-breakpoint
ALTER TABLE "aws_discovered_resources" ADD CONSTRAINT "fk_aws_resources_account_config" FOREIGN KEY ("aws_account_config_id") REFERENCES "public"."aws_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_aws_resources_account_config" ON "aws_discovered_resources" USING btree ("aws_account_config_id");