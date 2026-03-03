DROP INDEX IF EXISTS "text_chunk_content_tsv_idx";--> statement-breakpoint
ALTER TABLE "text_chunk" DROP COLUMN IF EXISTS "content_tsv";