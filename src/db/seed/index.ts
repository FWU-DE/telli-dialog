import { insertFederalStates } from './federal-state';
import { insertHelpModeGpt } from './help-mode';

insertFederalStates({ skip: false })
  .then(() => {
    console.info('database seed successful');
  })
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });

insertHelpModeGpt({ skip: false })
  .then(() => {
    console.log('database seed successful');
  })
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
