import { insertTemplateCharacters } from './default-characters';
import { insertFederalStates } from './federal-state';
import { insertHelpModeGpt } from './help-mode';
import { insertDummyUser } from './user-entity';

insertFederalStates({ skip: false })
  .then(() => {
    console.info('federalState seed successful');
  })
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });

insertHelpModeGpt({ skip: false })
  .then(() => {
    console.log('helpMode seed successful');
  })
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
insertDummyUser().then(() => {
  console.log('helpMode seed successful');
})
.catch((error) => {
  console.error({ error });
  process.exit(1);
});

insertTemplateCharacters()
  .then(() => console.log('template character seed successful'))
  .catch((error) => console.error({ error }));
