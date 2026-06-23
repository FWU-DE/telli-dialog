ALTER TABLE "assistant" ADD COLUMN "filter_attributes" json DEFAULT '{}'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "filter_attributes" json DEFAULT '{}'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "filter_attributes" json DEFAULT '{}'::json NOT NULL;