ALTER TABLE "custom_gpt" ADD COLUMN "school_id" text;--> statement-breakpoint
ALTER TABLE "custom_gpt" ADD COLUMN "access_level" character_access_level DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_gpt" ADD COLUMN "picture_id" text;--> statement-breakpoint
ALTER TABLE "custom_gpt" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "custom_gpt" ADD COLUMN "specification" text;--> statement-breakpoint
ALTER TABLE "custom_gpt" ADD COLUMN "prompt_suggestions" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_gpt" ADD CONSTRAINT "custom_gpt_school_id_school_id_fk"  FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE no action ON UPDATE no action;