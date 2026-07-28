CREATE TABLE "static_model_configuration" (
	"role" text PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "static_model_configuration" ADD CONSTRAINT "static_model_configuration_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;