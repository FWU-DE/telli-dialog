import fs from 'fs';

import { getErrorMessage } from '@/utils/error';

const FILE_PATH = 'e2e/fixtures/user-mappings.json';

export type Account = {
  sub: string;
  schulkennung: string;
  rolle: string;
  bundesland: string;
};

export function getMockUserByAccountId({ accountId }: { accountId: string }) {
  const users = readUserMappings();
  return users[accountId];
}

/**
 * Read user mappings from a file
 */
export function readUserMappings(filePath = FILE_PATH) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const userMappings = JSON.parse(fileContent);
    console.log(`Successfully read user mappings from ${filePath}`);
    return userMappings as Record<string, Account>;
  } catch (error) {
    console.error(`Error reading user mappings from file: ${getErrorMessage(error)}`);
    throw Error('Could not read file');
  }
}
