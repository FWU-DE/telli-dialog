ALTER TABLE "character" ADD COLUMN "is_link_shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_gpt" ADD COLUMN "is_link_shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "is_link_shared" boolean DEFAULT false NOT NULL;