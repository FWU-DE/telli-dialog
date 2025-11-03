import { insertTemplateCharacters, insertTemplateCustomGpt } from './default-characters';
import { insertFederalStates } from './federal-state';
import { insertHelpModeGpt } from './help-mode';
import { insertDummyUser } from './user-entity';

async function add() {
  const step1 = [insertFederalStates({ skip: false }), insertDummyUser()];
  await Promise.all(step1);
  const step2 = [
    insertHelpModeGpt({ skip: false }),
    insertTemplateCharacters(),
    insertTemplateCustomGpt(),
  ];
  await Promise.all(step2);
}

add()
  .then(() => {
    console.log('Seeding completed');
  })
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
