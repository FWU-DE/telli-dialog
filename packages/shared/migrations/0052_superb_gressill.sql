CREATE TYPE "public"."chunk_source_type" AS ENUM('file', 'webpage');--> statement-breakpoint
ALTER TABLE "text_chunk" ALTER COLUMN "file_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "text_chunk" ADD COLUMN "source_type" "chunk_source_type" DEFAULT 'file' NOT NULL;--> statement-breakpoint
ALTER TABLE "text_chunk" ADD COLUMN "source_url" text;--> statement-breakpoint
CREATE INDEX "text_chunk_source_url_index" ON "text_chunk" USING btree ("source_url");--> statement-breakpoint
ALTER TABLE "text_chunk" DROP COLUMN "leading_overlap";--> statement-breakpoint
ALTER TABLE "text_chunk" DROP COLUMN "trailing_overlap";