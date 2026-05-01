DROP INDEX "assistant_school_id_index";--> statement-breakpoint
DROP INDEX "character_school_id_index";--> statement-breakpoint
ALTER TABLE "assistant" DROP COLUMN "school_id";--> statement-breakpoint
ALTER TABLE "character" DROP COLUMN "school_id";--> statement-breakpoint
ALTER TABLE "learning_scenario" DROP COLUMN "school_id";