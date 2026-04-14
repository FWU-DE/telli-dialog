UPDATE "federal_state"
SET "design_configuration" = (
  jsonb_set(
    jsonb_set(
      (
        "design_configuration"::jsonb
        - 'secondaryDarkColor'
        - 'secondaryLightColor'
        - 'primaryHoverColor'
        - 'primaryHoverTextColor'
        - 'chatMessageBackgroundColor'
        - 'buttonPrimaryTextColor'
      ),
      '{primaryTextColor}',
      '"rgba(255, 255, 255, 1)"'::jsonb,
      true
    ),
    '{secondaryTextColor}',
    '"rgba(0, 0, 0, 1)"'::jsonb,
    true
  )::json
)
WHERE "design_configuration" IS NOT NULL;
