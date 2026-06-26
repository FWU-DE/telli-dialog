ALTER TABLE "shared_character_conversation" ADD COLUMN "expired_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" ADD COLUMN "expired_at" timestamp with time zone;--> statement-breakpoint

UPDATE "shared_learning_scenario"
SET "expired_at" = "started_at" + make_interval(mins => "max_usage_time_limit");--> statement-breakpoint
UPDATE "shared_character_conversation"
SET "expired_at" = "started_at" + make_interval(mins => "max_usage_time_limit");--> statement-breakpoint

ALTER TABLE "shared_character_conversation" ALTER COLUMN "expired_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" ALTER COLUMN "expired_at" SET NOT NULL;
