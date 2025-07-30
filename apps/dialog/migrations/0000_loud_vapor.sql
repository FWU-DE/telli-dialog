DO $$ BEGIN
 CREATE TYPE "public"."character_access_level" AS ENUM('private', 'school', 'global');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."conversation_role" AS ENUM('user', 'assistant', 'system', 'tool');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."llm_model_type" AS ENUM('text', 'image', 'fc');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_school_role" AS ENUM('student', 'teacher');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "character" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"learning_context" text,
	"specifications" text,
	"competence" text,
	"restrictions" text,
	"picture_id" text,
	"access_level" "character_access_level" DEFAULT 'private' NOT NULL,
	"school_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"conversation_id" uuid NOT NULL,
	"model_name" text,
	"user_id" uuid,
	"role" "conversation_role" NOT NULL,
	"order_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"user_id" uuid NOT NULL,
	"character_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"completion_tokens" integer NOT NULL,
	"prompt_tokens" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_state_llm_model_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"federal_state_id" text NOT NULL,
	"llm_model_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "federal_state_llm_model_mapping_federal_state_id_llm_model_id_unique" UNIQUE("federal_state_id","llm_model_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_state" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_price_limit" integer DEFAULT 500 NOT NULL,
	"student_price_limit" integer DEFAULT 200 NOT NULL,
	"encrypted_api_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llm_model" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_metada" json NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "llm_model_owner_name_unique" UNIQUE("owner","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school" (
	"id" text PRIMARY KEY NOT NULL,
	"federal_state_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shared_school_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"model_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"school_type" text DEFAULT '' NOT NULL,
	"grade_level" text DEFAULT '' NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"learning_context" text DEFAULT '' NOT NULL,
	"specification" text DEFAULT '' NOT NULL,
	"restrictions" text DEFAULT '' NOT NULL,
	"intelligence_points_limit" integer,
	"max_usage_time_limit" integer,
	"invite_code" text,
	"started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shared_school_conversation_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shared_school_conversation_usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"shared_school_conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"completion_tokens" integer NOT NULL,
	"prompt_tokens" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_school_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"school_id" text NOT NULL,
	"role" "user_school_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_school_mapping_user_id_school_id_unique" UNIQUE("user_id","school_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_entity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_entity_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "character" ADD CONSTRAINT "character_user_id_user_entity_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "character" ADD CONSTRAINT "character_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_user_id_user_entity_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_user_entity_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation" ADD CONSTRAINT "conversation_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_usage_tracking" ADD CONSTRAINT "conversation_usage_tracking_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "federal_state_llm_model_mapping" ADD CONSTRAINT "federal_state_llm_model_mapping_federal_state_id_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "federal_state_llm_model_mapping" ADD CONSTRAINT "federal_state_llm_model_mapping_llm_model_id_llm_model_id_fk" FOREIGN KEY ("llm_model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school" ADD CONSTRAINT "school_federal_state_id_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shared_school_conversation" ADD CONSTRAINT "shared_school_conversation_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shared_school_conversation" ADD CONSTRAINT "shared_school_conversation_user_id_user_entity_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shared_school_conversation_usage_tracking" ADD CONSTRAINT "shared_school_conversation_usage_tracking_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_school_mapping" ADD CONSTRAINT "user_school_mapping_user_id_user_entity_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_school_mapping" ADD CONSTRAINT "user_school_mapping_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
