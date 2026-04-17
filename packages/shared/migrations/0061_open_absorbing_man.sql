-- Custom SQL migration file, put your code below! --
-- Prepend schoolType/gradeLevel/subject context into additionalInstructions
-- for existing learning scenarios that have those fields filled.
-- Only prepends when at least one of the context fields is non-null.
UPDATE "learning_scenario"
SET "additional_instructions" = concat_ws(
  E'\n\n',
  COALESCE("additional_instructions", ''),
  CASE
    concat_ws(', ',
      CASE WHEN COALESCE(TRIM("school_type"), '') != '' THEN 'Schultyp: ' || "school_type" END,
      CASE WHEN COALESCE(TRIM("grade_level"), '') != '' THEN 'Klassenstufe: ' || "grade_level" END,
      CASE WHEN COALESCE(TRIM("subject"), '') != '' THEN 'Fach: ' || "subject" END
    )
  END
)
WHERE COALESCE(TRIM("school_type"), '') != ''
   OR COALESCE(TRIM("grade_level"), '') != ''
   OR COALESCE(TRIM("subject"), '') != '';
