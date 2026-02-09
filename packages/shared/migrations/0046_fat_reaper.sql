CREATE TABLE "learning_scenario_template_mappings" (
	"learning_scenario_id" uuid NOT NULL,
	"federal_state_id" text NOT NULL,
	CONSTRAINT "learning_scenario_template_mappings_pk" PRIMARY KEY("learning_scenario_id","federal_state_id")
);
--> statement-breakpoint
ALTER TABLE "learning_scenario_template_mappings" ADD CONSTRAINT "learning_scenario_template_mappings_learning_scenario_id_fk" FOREIGN KEY ("learning_scenario_id") REFERENCES "public"."federal_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_scenario_template_mappings" ADD CONSTRAINT "learning_scenario_template_mappings_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_learning_scenario" ADD CONSTRAINT "shared_learning_scenario_learning_scenario_id_fk" FOREIGN KEY ("learning_scenario_id") REFERENCES "public"."learning_scenario"("id") ON DELETE cascade ON UPDATE no action;