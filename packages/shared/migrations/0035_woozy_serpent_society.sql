ALTER TABLE "character" DROP CONSTRAINT "character_invite_code_unique";--> statement-breakpoint
ALTER TABLE "character" DROP COLUMN "intelligence_points_limit";--> statement-breakpoint
ALTER TABLE "character" DROP COLUMN "max_usage_time_limit";--> statement-breakpoint
ALTER TABLE "character" DROP COLUMN "invite_code";--> statement-breakpoint
ALTER TABLE "character" DROP COLUMN "started_at";