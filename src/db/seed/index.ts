import { insertFederalStates } from './federal-state';

insertFederalStates({ skip: false })
  .then(() => {
    console.info('database seed successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
