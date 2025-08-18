import CredentialsProvider from 'next-auth/providers/credentials';

export const credentialsProvider = CredentialsProvider({
  name: 'Credentials',
  id: 'credentials',
  credentials: {
    username: {
      label: 'Username',
      type: 'text',
    },
    password: { label: 'Password', type: 'password' },
  },
  async authorize() {
    return {
      id: '1',
      name: 'J Smith',
      email: 'jsmith@example.com',
    };
  },
});
