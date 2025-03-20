import { readUserMappings } from './load_test/utils';

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
