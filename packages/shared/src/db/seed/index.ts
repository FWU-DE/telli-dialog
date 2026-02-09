import { logError, logInfo } from '@shared/logging';
import { insertTemplateCharacters, insertTemplateCustomGpt } from './default-characters';
import { insertFederalStates } from './federal-state';
import { insertHelpModeGpt } from './help-mode';
import { insertDummyUser } from './user-entity';

async function add() {
  await Promise.all([insertFederalStates({ skip: false }), insertDummyUser()]);
  await Promise.all([
    insertHelpModeGpt({ skip: false }),
    insertTemplateCharacters(),
    insertTemplateCustomGpt(),
  ]);
}

add()
  .then(() => {
    logInfo('Seeding completed');
  })
  .catch((error) => {
    logError('Seeding failed', error);
    process.exit(1);
  });
