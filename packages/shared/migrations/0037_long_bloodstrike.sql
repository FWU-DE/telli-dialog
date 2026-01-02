ALTER TABLE "conversation_message_file_mapping" DROP CONSTRAINT "conversation_message_file_mapping_conversationMessageId_convers";
--> statement-breakpoint
ALTER TABLE "conversation_message_file_mapping" DROP CONSTRAINT "conversation_message_file_mapping_conversationId_conversation_i";
--> statement-breakpoint
ALTER TABLE "conversation_message_file_mapping" ADD CONSTRAINT "conversation_message_file_mapping_conversationMessageId_fk" FOREIGN KEY ("conversationMessageId") REFERENCES "public"."conversation_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_message_file_mapping" ADD CONSTRAINT "conversation_message_file_mapping_conversationId_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;