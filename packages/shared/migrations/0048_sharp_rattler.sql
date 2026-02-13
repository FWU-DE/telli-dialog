ALTER TABLE "character" ADD COLUMN "has_link_access" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_gpt" ADD COLUMN "has_link_access" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "has_link_access" boolean DEFAULT false NOT NULL;