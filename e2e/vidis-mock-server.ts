import Provider, { Configuration } from 'oidc-provider';

const APP_BASE_URL = 'http://127.0.0.1:3000';
const OIDC_SERVER_BASE_URL = 'http://127.0.0.1:9000';

const configuration = {
  clients: [
    {
      client_id: 'test',
      client_secret: 'testsecret',
      redirect_uris: [
        `${APP_BASE_URL}/api/auth/callback/vidis`,
        'http://localhost:3000/api/auth/callback/vidis',
      ],
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_method: 'client_secret_post',
    },
  ],
  async findAccount(ctx, id) {
    console.debug({ ctx, id });
    return {
      accountId: id,
      async claims(use, scope) {
        console.debug({ user, scole });
        return { sub: id, rolle: 'LEHR', schulkennung: '123456', bundesland: 'DE-BY' };
      },
    };
  },
  formats: {},
  features: {
    introspection: { enabled: true },
    revocation: { enabled: true },
  },
} satisfies Configuration;

const oidc = new Provider(OIDC_SERVER_BASE_URL, configuration);

oidc.listen(9000, () => {
  console.log(
    `oidc-provider listening on port 9000, check ${OIDC_SERVER_BASE_URL}/.well-known/openid-configuration`,
  );
});
