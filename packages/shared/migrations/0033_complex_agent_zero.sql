CREATE TYPE "public"."conversation_type" AS ENUM('chat', 'image-generation');--> statement-breakpoint
ALTER TABLE "conversation_message" ADD COLUMN "parameters" json;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "type" "conversation_type" DEFAULT 'chat' NOT NULL;