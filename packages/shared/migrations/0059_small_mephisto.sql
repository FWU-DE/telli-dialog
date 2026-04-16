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
      to_jsonb(COALESCE("design_configuration"::jsonb ->> 'buttonPrimaryTextColor', 'rgba(255, 255, 255, 1)')),
      true
    ),
    '{secondaryTextColor}',
    '"rgba(0, 0, 0, 1)"'::jsonb,
    true
  )::json
)
WHERE "design_configuration" IS NOT NULL;