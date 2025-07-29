CREATE TABLE "custom_gpt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"system_prompt" text NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "custom_gpt_id" uuid;--> statement-breakpoint
ALTER TABLE "custom_gpt" ADD CONSTRAINT "custom_gpt_user_id_user_entity_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_custom_gpt_id_custom_gpt_id_fk" FOREIGN KEY ("custom_gpt_id") REFERENCES "public"."custom_gpt"("id") ON DELETE no action ON UPDATE no action;