ALTER TABLE "shared_learning_scenario" ADD COLUMN "stopped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shared_character_conversation" ADD COLUMN "stopped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" DROP CONSTRAINT "shared_learning_scenario_learning_scenario_id_user_id_unique";--> statement-breakpoint
ALTER TABLE "shared_character_conversation" DROP CONSTRAINT "shared_character_conversation_character_id_user_id_unique";
