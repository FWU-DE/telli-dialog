import Provider, { Configuration } from 'oidc-provider';
import fs from 'fs';
import https from 'https';
import path from 'path';

const APP_BASE_URL = 'https://localhost:3000';
const OIDC_SERVER_BASE_URL = 'https://localhost:9000';

const MOCK_TEACHER_ID = 'd775207f-1f7a-424d-97b4-ab732bcce151';
const MOCK_STUDENT_ID = '43696ecd-3be7-41be-8c84-f28f6e6b1932';

console.debug({ NODE_ENV: process.env.NODE_ENV });

const configuration = {
  clients: [
    {
      client_id: 'test',
      client_secret: 'testsecret',
      redirect_uris: [`${APP_BASE_URL}/api/auth/callback/vidis`],
      response_types: ['code'],
      grant_types: ['authorization_code', ""],
      token_endpoint_auth_method: 'client_secret_post',
      scope: 'openid',
    },
  ],
  claims: {
    openid: [
      'sub',
      'aud',
      'exp',
      'iat',
      'iss',
      'auth_time',
      'azp',
      'jti',
      'typ',
      'session_state',
      'sid',
      // 'rolle',
      // 'schulkennung',
      // 'bundesland',
    ],
  },
  // scopes: ['openid'],
  async findAccount(ctx, id) {
    const session_state = Math.random().toString(36).substring(2);
    const jti = Math.random().toString(36).substring(2);

    const sub = id === 'teacher' ? MOCK_TEACHER_ID : id === 'student' ? MOCK_STUDENT_ID : undefined;
    console.debug({ sub });

    if (sub === undefined) {
      console.debug({ sub });
      throw Error('Could not find this user');
    }

    return {
      accountId: sub,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async claims(use, scope, claims, rejected) {
        const _claims = {
          sub,
          auth_time: Math.floor(Date.now() / 1000),
          jti,
          typ: 'ID',
          azp: 'test',
          session_state,
          sid: session_state,
          rolle: id === 'teacher' ? 'LEHR' : 'LERN',
          schulkennung: '123456',
          bundesland: 'DE-BY',
        };
        console.debug({ _claims });
        return _claims;
      },
    };
  },
  pkce: { required: () => false, methods: ['S256'] },
  formats: {},
  features: {
    introspection: { enabled: true },
    revocation: { enabled: true },
    // devInteractions: { enabled: false },
  },
  cookies: {
    keys: ['some-secure-key'],
  },
  ttl: {
    AccessToken: 1 * 60 * 60, // 1 hour
    AuthorizationCode: 10 * 60, // 10 minutes
    IdToken: 1 * 60 * 60, // 1 hour
    RefreshToken: 1 * 24 * 60 * 60, // 1 day
    Grant: 1 * 24 * 60 * 60, // 1 day - this removes the warning
  },
} satisfies Configuration;

const oidc = new Provider(OIDC_SERVER_BASE_URL, configuration);

oidc.use(async (ctx, next) => {
  console.debug('Incoming request:', {
    method: ctx.method,
    path: ctx.path,
    query: ctx.query,
    headers: ctx.headers,
  });

  try {
    await next();
    console.debug('Response:', {
      status: ctx.status,
      body: ctx.body,
    });
  } catch (error: Error) {
    console.error('Middleware error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.details,
      error_description: error.error_description,
    });
    throw error;
  }
});
// Debug routes
oidc.use(async (ctx, next) => {
  if (ctx.path.startsWith('/auth/')) {
    console.debug('Processing auth request:', {
      method: ctx.method,
      path: ctx.path,
      query: ctx.query,
    });
  }
  await next();
});

const CERT_DIR = path.resolve(process.cwd(), 'certificates');

// Read SSL certificate files
const httpsOptions = {
  key: fs.readFileSync(path.join(CERT_DIR, 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(CERT_DIR, 'localhost.pem')),
};

// Create HTTPS server with the OIDC provider callback
const server = https.createServer(httpsOptions, oidc.callback());

server.listen(9000, () => {
  console.log(
    `oidc-provider listening on port 9000, check ${OIDC_SERVER_BASE_URL}/.well-known/openid-configuration`,
  );
});
