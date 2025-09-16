-- Custom SQL migration file, put your code below! --
-- Migrate existing data to JSON format
UPDATE "federal_state"
SET "support_contact" = json_build_array("support_contact")
WHERE "support_contact" IS NOT NULL;