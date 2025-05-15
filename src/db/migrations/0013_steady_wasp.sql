CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "text_chunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"content" text NOT NULL,
	"order_index" integer NOT NULL,
	"page_number" integer
);
--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "school_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "school_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "grade_level" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "grade_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "subject" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "subject" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "text_chunk" ADD CONSTRAINT "text_chunk_file_id_file_table_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file_table"("id") ON DELETE no action ON UPDATE no action;