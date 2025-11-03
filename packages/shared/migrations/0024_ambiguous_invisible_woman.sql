ALTER TABLE "voucher" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "voucher" ALTER COLUMN "status" SET DEFAULT 'created'::text;--> statement-breakpoint
DROP TYPE "public"."voucher_status";--> statement-breakpoint
CREATE TYPE "public"."voucher_status" AS ENUM('created', 'redeemed', 'revoked');--> statement-breakpoint
ALTER TABLE "voucher" ALTER COLUMN "status" SET DEFAULT 'created'::"public"."voucher_status";--> statement-breakpoint
ALTER TABLE "voucher" ALTER COLUMN "status" SET DATA TYPE "public"."voucher_status" USING "status"::"public"."voucher_status";