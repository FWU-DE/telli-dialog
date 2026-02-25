CREATE TABLE "image_generation_usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number_of_images" integer NOT NULL,
	"model_id" uuid NOT NULL,
	"api_key_id" uuid NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_generation_usage_tracking" ADD CONSTRAINT "image_generation_usage_tracking_model_id_llm_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."llm_model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generation_usage_tracking" ADD CONSTRAINT "image_generation_usage_tracking_api_key_id_api_key_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_key"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generation_usage_tracking" ADD CONSTRAINT "image_generation_usage_tracking_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;