CREATE TABLE "character_template_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"federal_state_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_gpt_template_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"custom_gpt_id" uuid NOT NULL,
	"federal_state_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_template_mappings" ADD CONSTRAINT "character_template_mappings_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_template_mappings" ADD CONSTRAINT "character_template_mappings_federal_state_id_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_gpt_template_mappings" ADD CONSTRAINT "custom_gpt_template_mappings_custom_gpt_id_custom_gpt_id_fk" FOREIGN KEY ("custom_gpt_id") REFERENCES "public"."custom_gpt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_gpt_template_mappings" ADD CONSTRAINT "custom_gpt_template_mappings_federal_state_id_federal_state_id_fk" FOREIGN KEY ("federal_state_id") REFERENCES "public"."federal_state"("id") ON DELETE no action ON UPDATE no action;