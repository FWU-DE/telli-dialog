CREATE TYPE "public"."voucher_status" AS ENUM('active', 'used', 'revoked');--> statement-breakpoint
CREATE TABLE "voucher" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"increase_amount" integer NOT NULL,
	"duration_months" integer NOT NULL,
	"status" "voucher_status" DEFAULT 'active' NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"federal_state_id" text NOT NULL,
	"redeemed_by" uuid,
	"redeemed_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"create_reason" text DEFAULT '' NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone,
	"update_reason" text DEFAULT '' NOT NULL,
	CONSTRAINT "voucher_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_federal_state_id_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_redeemed_by_user_entity_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;