-- Fix order_number to be sequential per conversation, ordered by created_at.
WITH duplicate_conversations AS (
  SELECT conversation_id
  FROM conversation_message
  GROUP BY conversation_id
  HAVING COUNT(*) <> COUNT(DISTINCT order_number)
),
ranked_messages AS (
  SELECT
    id,
    conversation_id,
    ROW_NUMBER() OVER (
      PARTITION BY conversation_id
      ORDER BY created_at ASC, id ASC
    ) AS new_order_number
  FROM conversation_message
  WHERE conversation_id IN (SELECT conversation_id FROM duplicate_conversations)
)
UPDATE conversation_message
SET order_number = ranked_messages.new_order_number
FROM ranked_messages
WHERE conversation_message.id = ranked_messages.id
  AND conversation_message.order_number IS DISTINCT FROM ranked_messages.new_order_number;--> statement-breakpoint

-- Add unique constraint on (conversation_id, order_number) to prevent duplicates in the future
CREATE UNIQUE INDEX "conversation_message_conversation_id_order_number_unique" ON "conversation_message" USING btree ("conversation_id","order_number") WHERE "conversation_message"."deleted_at" is null;