ALTER TABLE "character_file_mapping" DROP CONSTRAINT "character_file_mapping_character_id_character_id_fk";
--> statement-breakpoint
ALTER TABLE "custom_gpt_file_mapping" DROP CONSTRAINT "custom_gpt_file_mapping_custom_gpt_id_custom_gpt_id_fk";
--> statement-breakpoint
ALTER TABLE "shared_conversation_file_mapping" DROP CONSTRAINT "shared_school_conversation_file_mapping_shared_school_conversat";
--> statement-breakpoint
ALTER TABLE "character_file_mapping" ADD CONSTRAINT "character_file_mapping_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_gpt_file_mapping" ADD CONSTRAINT "custom_gpt_file_mapping_custom_gpt_id_custom_gpt_id_fk" FOREIGN KEY ("custom_gpt_id") REFERENCES "public"."custom_gpt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_conversation_file_mapping" ADD CONSTRAINT "shared_school_conversation_id_shared_school_conversation_id_fk" FOREIGN KEY ("shared_school_conversation_id") REFERENCES "public"."shared_school_conversation"("id") ON DELETE cascade ON UPDATE no action;