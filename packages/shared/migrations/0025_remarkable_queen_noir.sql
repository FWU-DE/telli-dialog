ALTER TABLE "conversation_usage_tracking" ADD COLUMN "costs_in_cent" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_character_chat_usage_tracking" ADD COLUMN "costs_in_cent" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_school_conversation_usage_tracking" ADD COLUMN "costs_in_cent" double precision DEFAULT 0 NOT NULL;