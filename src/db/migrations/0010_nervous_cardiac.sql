ALTER TABLE "character" ALTER COLUMN "school_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "grade_level" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "subject" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "specification" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "specification" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "restrictions" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "restrictions" DROP NOT NULL;