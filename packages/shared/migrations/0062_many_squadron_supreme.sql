CREATE TYPE "public"."info_banner_type" AS ENUM('warning', 'info');--> statement-breakpoint
CREATE TABLE "info_banner_federal_state_mapping" (
	"info_banner_id" uuid NOT NULL,
	"federal_state_id" text NOT NULL,
	CONSTRAINT "info_banner_federal_state_mapping_info_banner_id_federal_state_id_pk" PRIMARY KEY("info_banner_id","federal_state_id")
);
--> statement-breakpoint
CREATE TABLE "info_banner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "info_banner_type" NOT NULL,
	"message" text NOT NULL,
	"cta_label" text,
	"cta_url" text,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"max_login_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_entity" ADD COLUMN "login_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "info_banner_federal_state_mapping" ADD CONSTRAINT "info_banner_federal_state_mapping_info_banner_id_info_banner_id_fk" FOREIGN KEY ("info_banner_id") REFERENCES "public"."info_banner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_banner_federal_state_mapping" ADD CONSTRAINT "info_banner_mapping_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "info_banner_federal_state_mapping_federal_state_id_index" ON "info_banner_federal_state_mapping" USING btree ("federal_state_id");--> statement-breakpoint
CREATE INDEX "info_banner_starts_at_index" ON "info_banner" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "info_banner_ends_at_index" ON "info_banner" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "info_banner_is_deleted_index" ON "info_banner" USING btree ("is_deleted");