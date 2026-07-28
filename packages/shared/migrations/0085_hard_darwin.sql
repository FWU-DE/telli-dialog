CREATE TABLE "static_model_configuration" (
	"role" text PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "static_model_configuration" ADD CONSTRAINT "static_model_configuration_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "static_model_configuration" ("role", "model_id")
SELECT 'default-chat', "id" FROM "llm_model" WHERE "name" = 'gpt-5-mini' ORDER BY "created_at" LIMIT 1;
--> statement-breakpoint
INSERT INTO "static_model_configuration" ("role", "model_id")
SELECT 'default-chat-fallback', "id" FROM "llm_model" WHERE "name" = 'gpt-5-nano' ORDER BY "created_at" LIMIT 1;
--> statement-breakpoint
INSERT INTO "static_model_configuration" ("role", "model_id")
SELECT 'auxiliary', "id" FROM "llm_model" WHERE "name" = 'gpt-4o-mini' ORDER BY "created_at" LIMIT 1;
--> statement-breakpoint
INSERT INTO "static_model_configuration" ("role", "model_id")
SELECT 'strong-auxiliary', "id" FROM "llm_model" WHERE "name" = 'gpt-5.5' ORDER BY "created_at" LIMIT 1;
--> statement-breakpoint
INSERT INTO "static_model_configuration" ("role", "model_id")
SELECT 'auxiliary-fallback', "id" FROM "llm_model" WHERE "name" = 'meta-llama/Llama-3.3-70B-Instruct' ORDER BY "created_at" LIMIT 1;
--> statement-breakpoint
INSERT INTO "static_model_configuration" ("role", "model_id")
SELECT 'default-image', "id" FROM "llm_model" WHERE "name" = 'imagen-4.0-generate-001' ORDER BY "created_at" LIMIT 1;
