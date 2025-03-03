CREATE TABLE "shared_character_chat_usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"completion_tokens" integer NOT NULL,
	"prompt_tokens" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
UPDATE "character" SET "description" = '' WHERE "description" IS NULL;
UPDATE "character" SET "learning_context" = '' WHERE "learning_context" IS NULL;
UPDATE "character" SET "competence" = '' WHERE "competence" IS NULL;
--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "learning_context" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "learning_context" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "competence" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "competence" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "model_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "school_type" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "grade_level" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "subject" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "intelligence_points_limit" integer;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "max_usage_time_limit" integer;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "invite_code" text;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shared_character_chat_usage_tracking" ADD CONSTRAINT "shared_character_chat_usage_tracking_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character" ADD CONSTRAINT "character_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character" ADD CONSTRAINT "character_invite_code_unique" UNIQUE("invite_code");
