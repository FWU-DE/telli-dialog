CREATE INDEX "api_key_project_id_index" ON "api_key" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "api_key_key_id_index" ON "api_key" USING btree ("key_id");--> statement-breakpoint
CREATE INDEX "completion_usage_tracking_api_key_id_index" ON "completion_usage_tracking" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "completion_usage_tracking_created_at_index" ON "completion_usage_tracking" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "image_generation_usage_tracking_api_key_id_index" ON "image_generation_usage_tracking" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "image_generation_usage_tracking_created_at_index" ON "image_generation_usage_tracking" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "llm_model_api_key_mapping_llm_model_id_index" ON "llm_model_api_key_mapping" USING btree ("llm_model_id");--> statement-breakpoint
CREATE INDEX "llm_model_api_key_mapping_api_key_id_index" ON "llm_model_api_key_mapping" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "llm_model_organization_id_index" ON "llm_model" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_organization_id_index" ON "project" USING btree ("organization_id");