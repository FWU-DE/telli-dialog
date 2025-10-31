ALTER TABLE "federal_state" ADD COLUMN "mandatory_certification_teacher" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "federal_state" ADD COLUMN "chat_storage_time" integer DEFAULT 120 NOT NULL;--> statement-breakpoint
ALTER TABLE "federal_state" ADD COLUMN "support_contact" text;--> statement-breakpoint
ALTER TABLE "federal_state" ADD COLUMN "training_link" text;--> statement-breakpoint
ALTER TABLE "federal_state" ADD COLUMN "student_access" boolean DEFAULT true NOT NULL;