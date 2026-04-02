ALTER TABLE "llm_model" ALTER COLUMN "additional_parameters" SET DEFAULT '{}'::json;
UPDATE "llm_model" SET "additional_parameters" = '{}'::json WHERE ("additional_parameters"::text = '[]');