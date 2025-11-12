DELETE FROM "character_template_mappings";--> statement-breakpoint
DELETE FROM "custom_gpt_template_mappings";--> statement-breakpoint
DROP INDEX "character_template_mappings_character_id_index";--> statement-breakpoint
DROP INDEX "character_template_mappings_federal_state_id_index";--> statement-breakpoint
DROP INDEX "custom_gpt_template_mappings_custom_gpt_id_index";--> statement-breakpoint
DROP INDEX "custom_gpt_template_mappings_federal_state_id_index";--> statement-breakpoint
ALTER TABLE "character_template_mappings" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "custom_gpt_template_mappings" DROP COLUMN "id";
ALTER TABLE "character_template_mappings" ADD CONSTRAINT "character_template_mappings_character_id_federal_state_id_pk" PRIMARY KEY("character_id","federal_state_id");--> statement-breakpoint
ALTER TABLE "custom_gpt_template_mappings" ADD CONSTRAINT "custom_gpt_template_mappings_custom_gpt_id_federal_state_id_pk" PRIMARY KEY("custom_gpt_id","federal_state_id");--> statement-breakpoint

-- Insert select, so all global templates are assigned to all federal states --
INSERT INTO "character_template_mappings" ("character_id", "federal_state_id")
SELECT c.id AS character_id, f.id AS federal_state_id
FROM "character" c, "federal_state" f
WHERE c.access_level = 'global';
INSERT INTO "custom_gpt_template_mappings" ("custom_gpt_id", "federal_state_id")
SELECT cgpt.id AS custom_gpt_id, f.id AS federal_state_id
FROM "custom_gpt" cgpt, "federal_state" f
WHERE cgpt.access_level = 'global';