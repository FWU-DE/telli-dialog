ALTER TABLE "text_chunk" RENAME TO "chunk";--> statement-breakpoint
ALTER TABLE "chunk" DROP CONSTRAINT "text_chunk_file_id_file_table_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "text_chunk_file_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "text_chunk_embedding_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "text_chunk_source_url_index";--> statement-breakpoint
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_file_id_file_table_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chunk_file_id_index" ON "chunk" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "chunk_embedding_idx" ON "chunk" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
ALTER TABLE "chunk" DROP COLUMN "page_number";--> statement-breakpoint
ALTER TABLE "conversation_message" DROP COLUMN "websearch_sources";--> statement-breakpoint
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_source_url_order_index_unique" UNIQUE("source_url","order_index");