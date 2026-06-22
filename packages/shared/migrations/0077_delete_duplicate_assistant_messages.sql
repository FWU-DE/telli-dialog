WITH ranked_duplicate_assistant_messages AS (
	SELECT
		id,
		ROW_NUMBER() OVER (
			PARTITION BY conversation_id, order_number, role
			ORDER BY created_at DESC, id DESC
		) AS duplicate_rank
	FROM conversation_message
	WHERE role = 'assistant'
		AND deleted_at IS NULL
)
UPDATE conversation_message
SET content = ' ',
		deleted_at = NOW()
WHERE id IN (
	SELECT id
	FROM ranked_duplicate_assistant_messages
	WHERE duplicate_rank > 1
);