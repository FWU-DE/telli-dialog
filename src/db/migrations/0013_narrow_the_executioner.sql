ALTER TABLE "shared_school_conversation" RENAME COLUMN "learning_context" TO "student_excercise";--> statement-breakpoint
ALTER TABLE "shared_school_conversation" RENAME COLUMN "specification" TO "additional_instructions";--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "school_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "school_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "grade_level" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "grade_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "subject" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shared_school_conversation" ALTER COLUMN "subject" DROP NOT NULL;--> statement-breakpoint