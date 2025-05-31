ALTER TABLE "services" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_deleted_at" ON "services" USING btree ("deleted_at");