CREATE TYPE "public"."tool_call_name" AS ENUM('web_search');--> statement-breakpoint
CREATE TABLE "tool_call_cost" (
	"tool_call_name" "tool_call_name" PRIMARY KEY NOT NULL,
	"costs_in_cent" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add initial cost for web search tool call --
INSERT INTO "tool_call_cost" ("tool_call_name", "costs_in_cent") VALUES ('web_search', 0.5) ON CONFLICT ("tool_call_name") DO NOTHING;

ALTER TABLE "conversation_usage_tracking" ALTER COLUMN "model_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_character_chat_usage_tracking" ALTER COLUMN "model_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario_usage_tracking" ALTER COLUMN "model_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_usage_tracking" ADD COLUMN "tool_call_name" "tool_call_name";--> statement-breakpoint
ALTER TABLE "shared_character_chat_usage_tracking" ADD COLUMN "tool_call_name" "tool_call_name";--> statement-breakpoint
ALTER TABLE "shared_learning_scenario_usage_tracking" ADD COLUMN "tool_call_name" "tool_call_name";