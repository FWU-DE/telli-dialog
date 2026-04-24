ALTER TABLE "assistant" DROP CONSTRAINT "assistant_school_id_school_id_fk";
--> statement-breakpoint
ALTER TABLE "character" DROP CONSTRAINT "character_school_id_school_id_fk";
--> statement-breakpoint
ALTER TABLE "learning_scenario" DROP CONSTRAINT "learning_scenario_school_id_school_id_fk";
--> statement-breakpoint
ALTER TABLE "user_entity" ADD COLUMN "school_ids" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "user_entity" ADD COLUMN "federal_state_id" text;--> statement-breakpoint
ALTER TABLE "user_entity" ADD COLUMN "user_role" "user_school_role" DEFAULT 'teacher' NOT NULL;--> statement-breakpoint
WITH mapped_user_data AS (
	SELECT
		usm.user_id,
		ARRAY_AGG(DISTINCT usm.school_id) AS school_ids,
		MIN(s.federal_state_id) AS federal_state_id,
		CASE
			WHEN BOOL_OR(usm.role = 'teacher') THEN 'teacher'::user_school_role
			ELSE 'student'::user_school_role
		END AS user_role
	FROM user_school_mapping usm
	LEFT JOIN school s ON s.id = usm.school_id
	GROUP BY usm.user_id
)
UPDATE user_entity ue
SET
	school_ids = mud.school_ids,
	federal_state_id = mud.federal_state_id,
	user_role = mud.user_role
FROM mapped_user_data mud
WHERE ue.id = mud.user_id;--> statement-breakpoint
ALTER TABLE "user_entity" ADD CONSTRAINT "user_entity_federal_state_id_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "school" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_school_mapping" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "school" CASCADE;--> statement-breakpoint
DROP TABLE "user_school_mapping" CASCADE;