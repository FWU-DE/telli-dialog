CREATE TABLE "learning_scenario_template_mappings" (
	"learning_scenario_id" uuid NOT NULL,
	"federal_state_id" text NOT NULL,
	CONSTRAINT "learning_scenario_template_mappings_pk" PRIMARY KEY("learning_scenario_id","federal_state_id")
);
--> statement-breakpoint
ALTER TABLE "learning_scenario_template_mappings" ADD CONSTRAINT "learning_scenario_template_mappings_learning_scenario_id_fk" FOREIGN KEY ("learning_scenario_id") REFERENCES "public"."federal_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_scenario_template_mappings" ADD CONSTRAINT "learning_scenario_template_mappings_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" ADD CONSTRAINT "shared_learning_scenario_learning_scenario_id_fk" FOREIGN KEY ("learning_scenario_id") REFERENCES "public"."learning_scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Set the schoolId for all learning scenarios; required for school-internal sharing
WITH first_school_per_user AS (
    SELECT DISTINCT ON (usm.user_id)
        usm.user_id,
        usm.school_id
    FROM user_school_mapping usm
    ORDER BY usm.user_id, usm.created_at
)
UPDATE learning_scenario ls
SET school_id = fs.school_id
FROM first_school_per_user fs
WHERE ls.school_id IS NULL
  AND fs.user_id = ls.user_id;