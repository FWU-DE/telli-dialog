ALTER TABLE "conversation_message" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."conversation_role";--> statement-breakpoint
CREATE TYPE "public"."conversation_role" AS ENUM('system', 'user', 'assistant', 'tool');--> statement-breakpoint
ALTER TABLE "conversation_message" ALTER COLUMN "role" SET DATA TYPE "public"."conversation_role" USING "role"::"public"."conversation_role";--> statement-breakpoint
ALTER TABLE "conversation_message" ADD COLUMN "tool_calls" json;--> statement-breakpoint
ALTER TABLE "conversation_message" ADD COLUMN "tool_call_id" text;