-- Set user_id on the conversation_message according to the value from the conversation
UPDATE conversation_message AS cm
SET user_id = c.user_id
FROM conversation AS c
WHERE c.id = cm.conversation_id
  AND cm.user_id IS NULL; --> statement-breakpoint

-- Fill model_name for messages where it's NULL using a model_name from another message
-- of the same conversation_id; if none exists in that conversation, fall back to 'imagen-4.0-generate-001'.
UPDATE conversation_message AS cm
SET model_name = COALESCE(
    (
        SELECT cm2.model_name
        FROM conversation_message AS cm2
        WHERE cm2.conversation_id = cm.conversation_id
          AND cm2.model_name IS NOT NULL
        LIMIT 1
    ),
    'imagen-4.0-generate-001'
)
WHERE cm.model_name IS NULL;--> statement-breakpoint

ALTER TABLE "conversation_message" ALTER COLUMN "model_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_message" ALTER COLUMN "user_id" SET NOT NULL;
