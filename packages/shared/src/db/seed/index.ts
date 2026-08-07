import {
  insertTemplateCharacters,
  insertTemplateAssistant,
  insertTemplateLearningScenarios,
} from './default-templates';
import { insertFederalStates } from './federal-state';
import { insertHelpModeGpt } from './help-mode';
import { insertDummyUser } from './user-entity';
import { initializeStaticModelConfigurations } from './static-model-configuration';

async function add() {
  await insertFederalStates({ skip: false });
  await initializeStaticModelConfigurations();
  await insertDummyUser();
  await Promise.all([
    insertHelpModeGpt({ skip: false }),
    insertTemplateCharacters(),
    insertTemplateAssistant(),
    insertTemplateLearningScenarios(),
  ]);
}

add()
  .then(() => {
    console.log('Seeding completed');
  })
  .catch((error) => {
    console.log('Seeding failed', error);
    process.exit(1);
  });
