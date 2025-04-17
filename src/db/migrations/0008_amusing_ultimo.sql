CREATE TABLE "shared_character_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"intelligence_points_limit" integer,
	"max_usage_time_limit" integer,
	"invite_code" text,
	"started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shared_character_conversation_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "school_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "grade_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "subject" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "federal_state" ADD COLUMN "enable_characters" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "federal_state" ADD COLUMN "enable_shared_chats" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "federal_state" ADD COLUMN "enable_custom_gpts" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_character_conversation" ADD CONSTRAINT  "shared_character_conversation_user_id_user_entity_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;