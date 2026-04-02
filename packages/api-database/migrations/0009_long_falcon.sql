ALTER TABLE "completion_usage_tracking" DROP CONSTRAINT "completion_usage_tracking_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "image_generation_usage_tracking" DROP CONSTRAINT "image_generation_usage_tracking_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "completion_usage_tracking" DROP COLUMN "project_id";--> statement-breakpoint
ALTER TABLE "image_generation_usage_tracking" DROP COLUMN "project_id";