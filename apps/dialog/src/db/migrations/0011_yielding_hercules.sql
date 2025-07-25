CREATE TABLE "character_file_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" text NOT NULL,
	"character_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_file_mapping_character_id_file_id_unique" UNIQUE("character_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "custom_gpt_file_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" text NOT NULL,
	"custom_gpt_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_gpt_file_mapping_custom_gpt_id_file_id_unique" UNIQUE("custom_gpt_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "shared_conversation_file_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fileId" text NOT NULL,
	"shared_school_conversation_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shared_conversation_file_mapping_shared_school_conversation_id_fileId_unique" UNIQUE("shared_school_conversation_id","fileId")
);
--> statement-breakpoint
ALTER TABLE "character_file_mapping" ADD CONSTRAINT "character_file_mapping_file_id_file_table_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_file_mapping" ADD CONSTRAINT "character_file_mapping_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_gpt_file_mapping" ADD CONSTRAINT "custom_gpt_file_mapping_file_id_file_table_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_gpt_file_mapping" ADD CONSTRAINT "custom_gpt_file_mapping_custom_gpt_id_custom_gpt_id_fk" FOREIGN KEY ("custom_gpt_id") REFERENCES "public"."custom_gpt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_conversation_file_mapping" ADD CONSTRAINT "shared_school_conversation_file_mapping_fileId_file_table_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."file_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_conversation_file_mapping" ADD CONSTRAINT "shared_school_conversation_file_mapping_shared_school_conversation_id_shared_school_conversation_id_fk" FOREIGN KEY ("shared_school_conversation_id") REFERENCES "public"."shared_school_conversation"("id") ON DELETE no action ON UPDATE no action;