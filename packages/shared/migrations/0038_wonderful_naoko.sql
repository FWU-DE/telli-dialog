ALTER TABLE "shared_conversation_file_mapping" DROP CONSTRAINT "shared_conversation_file_mapping_shared_school_conversation_id_";--> statement-breakpoint
ALTER TABLE "federal_state_llm_model_mapping" DROP CONSTRAINT "federal_state_llm_model_mapping_federal_state_id_llm_model_id_u";--> statement-breakpoint
ALTER TABLE "character_template_mappings" DROP CONSTRAINT "character_template_mappings_federal_state_id_federal_state_id_f";
--> statement-breakpoint
ALTER TABLE "custom_gpt_template_mappings" DROP CONSTRAINT "custom_gpt_template_mappings_federal_state_id_federal_state_id_";
--> statement-breakpoint
ALTER TABLE "federal_state_llm_model_mapping" DROP CONSTRAINT "federal_state_llm_model_mapping_federal_state_id_federal_state_";
--> statement-breakpoint
ALTER TABLE "shared_school_conversation_usage_tracking" DROP CONSTRAINT "shared_school_conversation_usage_tracking_model_id_llm_model_id";
--> statement-breakpoint
DROP INDEX "shared_school_conversation_usage_tracking_shared_school_convers";--> statement-breakpoint
ALTER TABLE "character_template_mappings" ADD CONSTRAINT "character_template_mappings_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_gpt_template_mappings" ADD CONSTRAINT "character_template_mappings_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federal_state_llm_model_mapping" ADD CONSTRAINT "federal_state_llm_model_mapping_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_school_conversation_usage_tracking" ADD CONSTRAINT "shared_school_conversation_usage_tracking_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shared_school_conversation_usage_tracking_conversation_id_index" ON "shared_school_conversation_usage_tracking" USING btree ("shared_school_conversation_id");--> statement-breakpoint
ALTER TABLE "shared_conversation_file_mapping" ADD CONSTRAINT "shared_conversation_file_mapping_conversation_id_fileId_unique" UNIQUE("shared_school_conversation_id","fileId");--> statement-breakpoint
ALTER TABLE "federal_state_llm_model_mapping" ADD CONSTRAINT "federal_state_llm_model_mapping_federal_state_llm_model_unique" UNIQUE("federal_state_id","llm_model_id");