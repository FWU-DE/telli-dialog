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
      return {
        id: 'da38b3fe-19de-342a-a743-aa11f718f4ac',
        email: 'testuser@example.com',
        name: 'Test User',
        rolle: 'LEHR',
        schulkennung: 'Test-Schule',
        bundesland: 'DE-TEST',
      };
    }
    return null;
  },
});
