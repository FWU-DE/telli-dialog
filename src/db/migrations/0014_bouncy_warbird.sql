CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "text_chunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"content" text NOT NULL,
	"leading_overlap" text,
	"trailing_overlap" text,
	"order_index" integer NOT NULL,
	"page_number" integer,
	"content_tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('german', content)) STORED NOT NULL
);
--> statement-breakpoint
ALTER TABLE "text_chunk" ADD CONSTRAINT "text_chunk_file_id_file_table_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file_table"("id") ON DELETE no action ON UPDATE no action;