-- Delete all legacy share rows before making columns non-nullable (these are manually stopped shares, which are safe to delete).
DELETE
FROM "shared_character_conversation"
WHERE "telli_points_limit" IS NULL
   OR "max_usage_time_limit" IS NULL
   OR "invite_code" IS NULL
   OR "started_at" IS NULL;--> statement-breakpoint
DELETE
FROM "shared_learning_scenario"
WHERE "telli_points_limit" IS NULL
   OR "max_usage_time_limit" IS NULL
   OR "invite_code" IS NULL
   OR "started_at" IS NULL;--> statement-breakpoint

ALTER TABLE "shared_character_conversation" DROP CONSTRAINT "shared_character_conversation_character_id_user_id_unique";--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" DROP CONSTRAINT "shared_learning_scenario_learning_scenario_id_user_id_unique";--> statement-breakpoint
ALTER TABLE "shared_character_conversation" ALTER COLUMN "telli_points_limit" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_character_conversation" ALTER COLUMN "max_usage_time_limit" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_character_conversation" ALTER COLUMN "invite_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_character_conversation" ALTER COLUMN "started_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "shared_character_conversation" ALTER COLUMN "started_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" ALTER COLUMN "telli_points_limit" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" ALTER COLUMN "max_usage_time_limit" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" ALTER COLUMN "invite_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" ALTER COLUMN "started_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_character_conversation" ADD COLUMN "manually_stopped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" ADD COLUMN "manually_stopped_at" timestamp with time zone;