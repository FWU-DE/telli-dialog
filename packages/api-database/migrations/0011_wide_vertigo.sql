ALTER TABLE "llm_model" ADD COLUMN "tier" text;--> statement-breakpoint
ALTER TABLE "llm_model" ADD COLUMN "open_source" boolean;--> statement-breakpoint
ALTER TABLE "llm_model" ADD COLUMN "data_location" text;