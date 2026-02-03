ALTER TABLE "shared_conversation_file_mapping" RENAME TO "learning_scenario_file_mapping";--> statement-breakpoint
ALTER TABLE "shared_school_conversation" RENAME TO "learning_scenario";--> statement-breakpoint
ALTER TABLE "shared_school_conversation_usage_tracking" RENAME TO "shared_learning_scenario_usage_tracking";--> statement-breakpoint
ALTER TABLE "learning_scenario_file_mapping" RENAME COLUMN "fileId" TO "file_id";--> statement-breakpoint
ALTER TABLE "learning_scenario_file_mapping" RENAME COLUMN "shared_school_conversation_id" TO "learning_scenario_id";--> statement-breakpoint
ALTER TABLE "shared_learning_scenario_usage_tracking" RENAME COLUMN "shared_school_conversation_id" TO "learning_scenario_id";--> statement-breakpoint
ALTER TABLE "learning_scenario_file_mapping" DROP CONSTRAINT "shared_conversation_file_mapping_conversation_id_fileId_unique";--> statement-breakpoint
ALTER TABLE "learning_scenario" DROP CONSTRAINT "shared_school_conversation_invite_code_unique";--> statement-breakpoint
ALTER TABLE "learning_scenario_file_mapping" DROP CONSTRAINT "shared_school_conversation_file_mapping_fileId_file_table_id_fk";
--> statement-breakpoint
ALTER TABLE "learning_scenario_file_mapping" DROP CONSTRAINT "shared_school_conversation_id_shared_school_conversation_id_fk";
--> statement-breakpoint
ALTER TABLE "learning_scenario" DROP CONSTRAINT "shared_school_conversation_model_id_llm_model_id_fk";
--> statement-breakpoint
ALTER TABLE "learning_scenario" DROP CONSTRAINT "shared_school_conversation_user_id_user_entity_id_fk";
--> statement-breakpoint
ALTER TABLE "shared_learning_scenario_usage_tracking" DROP CONSTRAINT "shared_school_conversation_usage_tracking_model_id_fk";
--> statement-breakpoint
DROP INDEX "shared_school_conversation_user_id_index";--> statement-breakpoint
DROP INDEX "shared_school_conversation_usage_tracking_conversation_id_index";--> statement-breakpoint
DROP INDEX "shared_school_conversation_usage_tracking_user_id_index";--> statement-breakpoint
DROP INDEX "shared_school_conversation_usage_tracking_created_at_index";--> statement-breakpoint
ALTER TABLE "learning_scenario_file_mapping" ADD CONSTRAINT "learning_scenario_file_mapping_file_id_file_table_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_scenario_file_mapping" ADD CONSTRAINT "learning_scenario_file_mapping_learning_scenario_id_fk" FOREIGN KEY ("learning_scenario_id") REFERENCES "public"."learning_scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD CONSTRAINT "learning_scenario_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD CONSTRAINT "learning_scenario_user_id_user_entity_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario_usage_tracking" ADD CONSTRAINT "shared_learning_scenario_usage_tracking_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_scenario_user_id_index" ON "learning_scenario" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shared_learning_scenario_usage_tracking_conversation_id_index" ON "shared_learning_scenario_usage_tracking" USING btree ("learning_scenario_id");--> statement-breakpoint
CREATE INDEX "shared_learning_scenario_usage_tracking_user_id_index" ON "shared_learning_scenario_usage_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shared_learning_scenario_usage_tracking_created_at_index" ON "shared_learning_scenario_usage_tracking" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "learning_scenario_file_mapping" ADD CONSTRAINT "learning_scenario_file_mapping_learningScenarioId_fileId_unique" UNIQUE("learning_scenario_id","file_id");--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD CONSTRAINT "learning_scenario_invite_code_unique" UNIQUE("invite_code");