import { dbGetOrCreateTestUser } from '@/db/functions/vidis';
import CredentialsProvider from 'next-auth/providers/credentials';
export const credentialsProvider = CredentialsProvider({
  id: 'credentials',
  name: 'Test Credentials',
  credentials: {
    username: { label: 'Username', type: 'text' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    if (
      credentials?.username === 'test' &&
      credentials?.password === process.env.LOADTEST_PASSWORD
    ) {
      return await dbGetOrCreateTestUser({
        id: 'f4830567-2ca9-4b9c-9c27-1900d443c07c',
        sub: 'f4830567-2ca9-4b9c-9c27-1900d443c07c',
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        rolle: 'LEHR',
        schulkennung: 'Test-Schule',
        bundesland: 'DE-TEST',
      });
    }
    return null;
  },
});
