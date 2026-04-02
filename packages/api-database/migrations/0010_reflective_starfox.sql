DROP INDEX "completion_usage_tracking_api_key_id_index";--> statement-breakpoint
DROP INDEX "completion_usage_tracking_created_at_index";--> statement-breakpoint
DROP INDEX "image_generation_usage_tracking_api_key_id_index";--> statement-breakpoint
DROP INDEX "image_generation_usage_tracking_created_at_index";--> statement-breakpoint
CREATE INDEX "completion_usage_tracking_api_key_id_created_at_index" ON "completion_usage_tracking" USING btree ("api_key_id","created_at");--> statement-breakpoint
CREATE INDEX "image_generation_usage_tracking_api_key_id_created_at_index" ON "image_generation_usage_tracking" USING btree ("api_key_id","created_at");