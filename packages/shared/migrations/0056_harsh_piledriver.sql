ALTER TABLE "character" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

UPDATE "character" SET "updated_at" = "created_at";
UPDATE "learning_scenario" SET "updated_at" = "created_at";
/* Since this wasn't done previously and both of the migrations will be deployed shortly after each other */
UPDATE "assistant" SET "updated_at" = "created_at";