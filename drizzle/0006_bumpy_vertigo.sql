CREATE TABLE "aws_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_name" text NOT NULL,
	"account_id" text NOT NULL,
	"access_key_id" text NOT NULL,
	"secret_access_key" text NOT NULL,
	"default_region" text DEFAULT 'us-east-1' NOT NULL,
	"regions" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"description" text,
	"organization_role" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "aws_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_aws_accounts_account_id" ON "aws_accounts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_aws_accounts_active" ON "aws_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_aws_accounts_default" ON "aws_accounts" USING btree ("is_default");