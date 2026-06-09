ALTER TABLE "assistant" ADD COLUMN "author" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "author" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "author" text DEFAULT '' NOT NULL;