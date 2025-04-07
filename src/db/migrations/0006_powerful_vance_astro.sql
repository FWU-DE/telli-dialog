CREATE TABLE "conversation_file_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fileId" text NOT NULL,
	"conversationId" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_file_mapping_conversationId_fileId_unique" UNIQUE("conversationId","fileId")
);
--> statement-breakpoint
CREATE TABLE "file_table" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_file_mapping" ADD CONSTRAINT "conversation_file_mapping_fileId_file_table_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."file_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_file_mapping" ADD CONSTRAINT "conversation_file_mapping_conversationId_conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;