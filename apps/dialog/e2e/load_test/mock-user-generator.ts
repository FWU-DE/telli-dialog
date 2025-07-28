import { generateUsers, writeUserMappings } from './utils';

const users = generateUsers();
writeUserMappings(users);
