CREATE TABLE "shared_learning_scenario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_scenario_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"telli_points_limit" integer,
	"max_usage_time_limit" integer,
	"invite_code" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shared_learning_scenario_invite_code_unique" UNIQUE("invite_code"),
	CONSTRAINT "shared_learning_scenario_learning_scenario_id_user_id_unique" UNIQUE("learning_scenario_id","user_id")
);
--> statement-breakpoint

-- Migrate data from "learning_scenario" to "shared_learning_scenario"
INSERT INTO "shared_learning_scenario" (
    "learning_scenario_id",
    "user_id",
    "telli_points_limit",
    "max_usage_time_limit",
    "invite_code",
    "started_at"
)
SELECT
    ls."id" AS "learning_scenario_id",
    ls."user_id",
    ls."telli_points_limit",
    ls."max_usage_time_limit",
    ls."invite_code",
    ls."started_at"
FROM "learning_scenario" ls
WHERE ls."started_at" IS NOT NULL;
--> statement-breakpoint

ALTER TABLE "learning_scenario" DROP CONSTRAINT "learning_scenario_invite_code_unique";--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "access_level" "access_level" DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "school_id" text;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "original_learning_scenario_id" uuid;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" ADD CONSTRAINT "shared_learning_scenario_user_id_user_entity_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD CONSTRAINT "learning_scenario_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_scenario" DROP COLUMN "telli_points_limit";--> statement-breakpoint
ALTER TABLE "learning_scenario" DROP COLUMN "max_usage_time_limit";--> statement-breakpoint
ALTER TABLE "learning_scenario" DROP COLUMN "invite_code";--> statement-breakpoint
ALTER TABLE "learning_scenario" DROP COLUMN "started_at";