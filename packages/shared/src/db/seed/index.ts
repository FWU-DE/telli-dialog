import {
  insertTemplateCharacters,
  insertTemplateCustomGpt,
  insertTemplateLearningScenarios,
} from './default-templates';
import { insertFederalStates } from './federal-state';
import { insertHelpModeGpt } from './help-mode';
import { insertDummyUser } from './user-entity';

async function add() {
  await Promise.all([insertFederalStates({ skip: false }), insertDummyUser()]);
  await Promise.all([
    insertHelpModeGpt({ skip: false }),
    insertTemplateCharacters(),
    insertTemplateCustomGpt(),
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
