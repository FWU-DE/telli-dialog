-- Populate the instructions field from existing legacy fields
-- (learningContext, competence, specifications, restrictions, schoolType, gradeLevel, subject)
-- Only updates characters where instructions is still empty.
UPDATE "character"
SET "instructions" = concat_ws(
  E'\n\n',
  CASE
    WHEN "school_type" IS NOT NULL OR "grade_level" IS NOT NULL OR "subject" IS NOT NULL
    THEN concat_ws(', ',
      CASE WHEN "school_type" IS NOT NULL THEN 'Schultyp: ' || "school_type" END,
      CASE WHEN "grade_level" IS NOT NULL THEN 'Klassenstufe: ' || "grade_level" END,
      CASE WHEN "subject" IS NOT NULL THEN 'Fach: ' || "subject" END
    )
  END,
  NULLIF("learning_context", ''),
  CASE
    WHEN "competence" IS NOT NULL AND "competence" != ''
    THEN 'Die Lernenden sollen folgende Kompetenzen erwerben: ' || "competence"
  END,
  CASE
    WHEN "specifications" IS NOT NULL AND "specifications" != ''
    THEN 'Bitte beachte: ' || "specifications"
  END,
  CASE
    WHEN "restrictions" IS NOT NULL AND "restrictions" != ''
    THEN 'Auf keinen Fall: ' || "restrictions"
  END
)
WHERE "instructions" = '' OR "instructions" IS NULL;
