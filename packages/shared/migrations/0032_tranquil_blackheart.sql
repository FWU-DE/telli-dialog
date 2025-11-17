ALTER TABLE "federal_state" ADD COLUMN "feature_toggles" json;--> statement-breakpoint
  -- migrate data from old columns to new json column  
UPDATE "federal_state" SET "feature_toggles" = json_build_object(
'isStudentAccessEnabled', "student_access",
'isCharacterEnabled', "enable_characters",
'isSharedChatEnabled', "enable_shared_chats",
'isCustomGptEnabled', "enable_custom_gpts",
'isShareTemplateWithSchoolEnabled', true
);--> statement-breakpoint
ALTER TABLE "federal_state" ALTER COLUMN "feature_toggles" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "federal_state" DROP COLUMN "student_access";--> statement-breakpoint
ALTER TABLE "federal_state" DROP COLUMN "enable_characters";--> statement-breakpoint
ALTER TABLE "federal_state" DROP COLUMN "enable_shared_chats";--> statement-breakpoint
ALTER TABLE "federal_state" DROP COLUMN "enable_custom_gpts";