-- Prepend schoolType/gradeLevel/subject context into additionalInstructions
-- for existing learning scenarios that have those fields filled.
-- Only prepends when at least one of the context fields is non-null.
UPDATE "learning_scenario"
SET "additional_instructions" = concat_ws(
  E'\n\n',
  CASE
    WHEN "school_type" IS NOT NULL OR "grade_level" IS NOT NULL OR "subject" IS NOT NULL
    THEN concat_ws(', ',
      CASE WHEN "school_type" IS NOT NULL THEN 'Schultyp: ' || "school_type" END,
      CASE WHEN "grade_level" IS NOT NULL THEN 'Klassenstufe: ' || "grade_level" END,
      CASE WHEN "subject" IS NOT NULL THEN 'Fach: ' || "subject" END
    )
  END,
  NULLIF("additional_instructions", '')
)
WHERE "school_type" IS NOT NULL
   OR "grade_level" IS NOT NULL
   OR "subject" IS NOT NULL;
