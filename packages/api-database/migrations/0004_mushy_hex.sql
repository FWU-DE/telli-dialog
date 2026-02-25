ALTER TABLE "llm_model" ADD COLUMN "additional_parameters" json DEFAULT '[]'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_model" ADD COLUMN "is_new" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_model" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;