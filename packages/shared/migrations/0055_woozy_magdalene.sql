ALTER TABLE "custom_gpt_file_mapping" RENAME TO "assistant_file_mapping";--> statement-breakpoint
ALTER TABLE "custom_gpt" RENAME TO "assistant";--> statement-breakpoint
ALTER TABLE "custom_gpt_template_mappings" RENAME TO "assistant_template_mappings";--> statement-breakpoint
ALTER TABLE "assistant_file_mapping" RENAME COLUMN "custom_gpt_id" TO "assistant_id";--> statement-breakpoint
ALTER TABLE "conversation" RENAME COLUMN "custom_gpt_id" TO "assistant_id";--> statement-breakpoint
ALTER TABLE "assistant" RENAME COLUMN "specification" TO "instructions";--> statement-breakpoint
ALTER TABLE "assistant" RENAME COLUMN "original_custom_gpt_id" TO "original_assistant_id";--> statement-breakpoint
ALTER TABLE "assistant_template_mappings" RENAME COLUMN "custom_gpt_id" TO "assistant_id";--> statement-breakpoint
ALTER TABLE "assistant_file_mapping" DROP CONSTRAINT "custom_gpt_file_mapping_custom_gpt_id_file_id_unique";--> statement-breakpoint
ALTER TABLE "assistant_file_mapping" DROP CONSTRAINT "custom_gpt_file_mapping_file_id_file_table_id_fk";
--> statement-breakpoint
ALTER TABLE "assistant_file_mapping" DROP CONSTRAINT "custom_gpt_file_mapping_custom_gpt_id_custom_gpt_id_fk";
--> statement-breakpoint
ALTER TABLE "conversation" DROP CONSTRAINT "conversation_custom_gpt_id_custom_gpt_id_fk";
--> statement-breakpoint
ALTER TABLE "assistant" DROP CONSTRAINT "custom_gpt_user_id_user_entity_id_fk";
--> statement-breakpoint
ALTER TABLE "assistant" DROP CONSTRAINT "custom_gpt_school_id_school_id_fk";
--> statement-breakpoint
ALTER TABLE "assistant_template_mappings" DROP CONSTRAINT "custom_gpt_template_mappings_custom_gpt_id_custom_gpt_id_fk";
--> statement-breakpoint
ALTER TABLE "assistant_template_mappings" DROP CONSTRAINT "character_template_mappings_federal_state_id_fk";
--> statement-breakpoint
DROP INDEX "conversation_custom_gpt_id_index";--> statement-breakpoint
DROP INDEX "custom_gpt_user_id_index";--> statement-breakpoint
DROP INDEX "custom_gpt_school_id_index";--> statement-breakpoint
ALTER TABLE "assistant_template_mappings" DROP CONSTRAINT "custom_gpt_template_mappings_custom_gpt_id_federal_state_id_pk";--> statement-breakpoint
ALTER TABLE "assistant_template_mappings" ADD CONSTRAINT "assistant_template_mappings_assistant_id_federal_state_id_pk" PRIMARY KEY("assistant_id","federal_state_id");--> statement-breakpoint
ALTER TABLE "assistant" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_file_mapping" ADD CONSTRAINT "assistant_file_mapping_file_id_file_table_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_file_mapping" ADD CONSTRAINT "assistant_file_mapping_assistant_id_assistant_id_fk" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_assistant_id_assistant_id_fk" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant" ADD CONSTRAINT "assistant_user_id_user_entity_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant" ADD CONSTRAINT "assistant_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_template_mappings" ADD CONSTRAINT "assistant_template_mappings_assistant_id_assistant_id_fk" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_template_mappings" ADD CONSTRAINT "assistant_template_mappings_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversation_assistant_id_index" ON "conversation" USING btree ("assistant_id");--> statement-breakpoint
CREATE INDEX "assistant_user_id_index" ON "assistant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assistant_school_id_index" ON "assistant" USING btree ("school_id");--> statement-breakpoint
ALTER TABLE "assistant_file_mapping" ADD CONSTRAINT "assistant_file_mapping_assistant_id_file_id_unique" UNIQUE("assistant_id","file_id");