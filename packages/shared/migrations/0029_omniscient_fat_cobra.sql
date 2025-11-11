ALTER TABLE "conversation_message" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."conversation_role";--> statement-breakpoint
CREATE TYPE "public"."conversation_role" AS ENUM('user', 'assistant', 'system', 'data');--> statement-breakpoint
ALTER TABLE "conversation_message" ALTER COLUMN "role" SET DATA TYPE "public"."conversation_role" USING "role"::"public"."conversation_role";