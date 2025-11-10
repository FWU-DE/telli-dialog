ALTER TABLE "text_chunk" DROP CONSTRAINT "text_chunk_file_id_file_table_id_fk";
--> statement-breakpoint
ALTER TABLE "text_chunk" ADD CONSTRAINT "text_chunk_file_id_file_table_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file_table"("id") ON DELETE cascade ON UPDATE no action;