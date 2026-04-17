export function buildAssistantPictureKey(assistantId: string, filename: string) {
  // the path still contains custom-gpts because all existing assistants store their picture in this folder in S3
  return `custom-gpts/${assistantId}/${filename}`;
}

export function buildCharacterPictureKey(characterId: string, filename: string) {
  return `characters/${characterId}/${filename}`;
}

export function buildLearningScenarioPictureKey(learningScenarioId: string, filename: string) {
  // the path still contains shared-chats because all existing learning scenarios store their picture in this folder in S3
  return `shared-chats/${learningScenarioId}/${filename}`;
}
