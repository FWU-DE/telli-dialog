ALTER TABLE "character" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint

UPDATE "character" SET "updated_at" = "created_at";--> statement-breakpoint
UPDATE "learning_scenario" SET "updated_at" = "created_at";--> statement-breakpoint
/* Since this wasn't done previously and both of the migrations will be deployed shortly after each other */
UPDATE "assistant" SET "updated_at" = "created_at";--> statement-breakpoint