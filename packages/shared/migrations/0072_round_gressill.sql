CREATE TYPE "public"."entity_report_reason" AS ENUM('copyright_violation', 'false_or_outdated_information', 'insufficient_sources', 'discrimination', 'personal_data_usage_or_query', 'violence_or_extremist_content', 'sexualized_content', 'other');--> statement-breakpoint
CREATE TABLE "entity_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assistant_id" uuid,
	"character_id" uuid,
	"learning_scenario_id" uuid,
	"reporter_id" uuid,
	"reason" "entity_report_reason" NOT NULL,
	"description" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	CONSTRAINT "entity_report_exactly_one_target_ck" CHECK ((("entity_report"."assistant_id" IS NOT NULL)::int + ("entity_report"."character_id" IS NOT NULL)::int + ("entity_report"."learning_scenario_id" IS NOT NULL)::int) = 1)
);
--> statement-breakpoint
ALTER TABLE "assistant" ADD COLUMN "suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_scenario" ADD COLUMN "suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "entity_report" ADD CONSTRAINT "entity_report_assistant_id_assistant_id_fk" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_report" ADD CONSTRAINT "entity_report_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_report" ADD CONSTRAINT "entity_report_learning_scenario_id_learning_scenario_id_fk" FOREIGN KEY ("learning_scenario_id") REFERENCES "public"."learning_scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_report" ADD CONSTRAINT "entity_report_reporter_id_user_entity_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user_entity"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entity_report_assistant_id_index" ON "entity_report" USING btree ("assistant_id");--> statement-breakpoint
CREATE INDEX "entity_report_character_id_index" ON "entity_report" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "entity_report_learning_scenario_id_index" ON "entity_report" USING btree ("learning_scenario_id");--> statement-breakpoint
CREATE INDEX "entity_report_reporter_id_index" ON "entity_report" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "entity_report_created_at_index" ON "entity_report" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "entity_report_checked_index" ON "entity_report" USING btree ("checked");