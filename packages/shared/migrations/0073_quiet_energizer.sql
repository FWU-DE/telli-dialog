CREATE TYPE "public"."share_target" AS ENUM('school', 'community');--> statement-breakpoint
ALTER TYPE "public"."access_level" ADD VALUE 'community' BEFORE 'global';--> statement-breakpoint
ALTER TABLE "assistant" ADD COLUMN "share_targets" "share_target"[] DEFAULT '{}'::share_target[] NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "share_targets" "share_target"[] DEFAULT '{}'::share_target[] NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "share_targets" "share_target"[] DEFAULT '{}'::share_target[] NOT NULL;--> statement-breakpoint

UPDATE "assistant" SET "share_targets" = ARRAY['school']::share_target[]
WHERE "access_level" = 'school' AND "share_targets" = '{}'::share_target[];--> statement-breakpoint
UPDATE "character" SET "share_targets" = ARRAY['school']::share_target[]
WHERE "access_level" = 'school' AND "share_targets" = '{}'::share_target[];--> statement-breakpoint
UPDATE "learning_scenario" SET "share_targets" = ARRAY['school']::share_target[]
WHERE "access_level" = 'school' AND "share_targets" = '{}'::share_target[];--> statement-breakpoint
