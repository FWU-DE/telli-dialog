CREATE TABLE "shared_character_chat_usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"completion_tokens" integer NOT NULL,
	"prompt_tokens" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shared_character_chat_usage_tracking" ADD CONSTRAINT "shared_character_chat_usage_tracking_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;