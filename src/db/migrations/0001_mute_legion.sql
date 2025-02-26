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
ALTER TABLE "character" ADD CONSTRAINT "character_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character" ADD CONSTRAINT "character_invite_code_unique" UNIQUE("invite_code");