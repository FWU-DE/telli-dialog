ALTER TABLE "federal_state" RENAME COLUMN "support_contact" TO "support_contacts";
-- Manually set, because drizzle-kit didn't automatically include this
ALTER TABLE "federal_state" ALTER COLUMN "support_contacts" SET DATA TYPE json USING "support_contacts"::json;