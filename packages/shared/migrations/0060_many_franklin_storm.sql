-- Custom SQL migration file, put your code below! --
-- Populate the instructions field from existing legacy fields
-- (learningContext, competence, specifications, restrictions, schoolType, gradeLevel, subject)
-- Only updates characters where instructions is still empty.
UPDATE "character"
SET "instructions" = concat_ws(
  E'\n\n',
  CASE
    WHEN COALESCE(TRIM("specifications"), '') != ''
    THEN 'Du sollst folgendes beachten:' || E'\n' || "specifications"
  END,
  CASE
    WHEN COALESCE(TRIM("restrictions"), '') != ''
    THEN 'Folgende Dinge sollst du AUF KEINEN FALL tun:' || E'\n' || "restrictions"
  END,
  CASE
    WHEN COALESCE(TRIM("learning_context"), '') != ''
    THEN 'Du wist im folgenden Lernkontext verwendet:' || E'\n' || "learning_context"
  END,
  CASE
    WHEN COALESCE(TRIM("competence"), '') != ''
    THEN 'Die Lernenden sollen folgende Kompetenzen erwerben: ' || "competence"
  END,
  CASE
    WHEN COALESCE(TRIM("school_type"), '') != '' OR COALESCE(TRIM("grade_level"), '') != '' OR COALESCE(TRIM("subject"), '') != ''
      THEN concat_ws(', ',
        CASE WHEN COALESCE(TRIM("school_type"), '') != '' THEN 'Schultyp: ' || "school_type" END,
        CASE WHEN COALESCE(TRIM("grade_level"), '') != '' THEN 'Klassenstufe: ' || "grade_level" END,
        CASE WHEN COALESCE(TRIM("subject"), '') != '' THEN 'Fach: ' || "subject" END
      )
  END
)
WHERE COALESCE(TRIM("instructions"), '') = '';