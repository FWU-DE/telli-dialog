CREATE TABLE "url_preset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"order_number" integer DEFAULT 0 NOT NULL,
	"urls" text[] NOT NULL,
	CONSTRAINT "url_preset_name_unique" UNIQUE("name")
);
