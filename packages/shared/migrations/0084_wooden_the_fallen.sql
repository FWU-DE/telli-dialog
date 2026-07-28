CREATE TYPE "public"."web_search_scope" AS ENUM('all-web', 'included-domains');--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "web_search_scope" "web_search_scope" DEFAULT 'all-web' NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "web_search_included_domains" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "web_search_scope" "web_search_scope" DEFAULT 'all-web' NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "web_search_included_domains" text[] DEFAULT '{}'::text[] NOT NULL;