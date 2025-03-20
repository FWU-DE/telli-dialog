import Provider, { Configuration } from 'oidc-provider';
import express from 'express';
import crypto from 'crypto';
import * as jose from 'jose';
import { readUserMappings } from './load_test/utils';

const isProduction = process.env.NODE_ENV === 'production';

const PORT = process.env.PORT || 9000;
const ISSUER_URL = isProduction ? 'https://vidis-mock.dgpt.app' : `http://localhost:${PORT}`;
console.info({ PORT, ISSUER_URL });

const VALID_REDIRECT_URLS = [
  'http://localhost:3000',
  'https://titanom.ngrok.app',
  'https://chat.telli.schule',
  'https://chat-staging.telli.schule',
];

// Create express app
let app = express();
if (isProduction) {
  app = app.set('trust-proxy', true);
}

const userAccountMapping = readUserMappings();

let userCount = 0;

// Create a simple PKCE-enabled client configuration
const clientConfig = {
  client_id: 'vidis-client', // Should match env.vidisClientId in your next-auth config
  client_secret: 'vidis-secret', // Should match env.vidisClientSecret in your next-auth config
  // redirect_uris: ['http://localhost:3000/api/auth/callback/vidis'], // Update to match your next-auth callback
  redirect_uris: [
    ...VALID_REDIRECT_URLS.map((u) => `${u}/api/auth/callback/vidis`),
    ...VALID_REDIRECT_URLS.map((u) => `${u}/api/auth/callback/vidis-mock`),
  ],
  response_types: ['code'],
  grant_types: ['authorization_code', 'refresh_token'],
  token_endpoint_auth_method: 'client_secret_basic',
} satisfies NonNullable<Configuration['clients']>[number];

// OIDC provider configuration
const providerConfig: Configuration = {
  clients: [clientConfig],
  pkce: {
    methods: ['S256'],
    required: () => true, // Require PKCE for all clients
  },
  features: {
    devInteractions: { enabled: true },
  },
  conformIdTokenClaims: false, // Allow custom claims in ID token
  cookies: {
    keys: ['some-secure-key'],
    long: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction, // Explicitly set to false for local development
    },
    short: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction, // Explicitly set to false for local development
    },
  },
  claims: {
    openid: ['sub', 'rolle', 'schulkennung', 'bundesland'],
  },
  async findAccount(ctx, id: string) {
    const maybeAccount = userAccountMapping[id];

    if (maybeAccount === undefined) {
      throw Error(`Expected teacher or student but got '${id}'`);
    }
    return {
      accountId: id,
      async claims(use: string, scope: string) {
        return {
          sub: maybeAccount.sub,
          rolle: maybeAccount.rolle,
          schulkennung: maybeAccount.schulkennung,
          bundesland: maybeAccount.bundesland,
        };
      },
    };
  },
  async extraTokenClaims(ctx, token) {
    // @ts-expect-error property exists
    const maybeAccount = userAccountMapping[token.accountId];
    if (maybeAccount === undefined) {
      // @ts-expect-error property exists
      throw Error(`Expected teacher or student but got '${token.accountId}'`);
    }
    userCount = userCount + 1;
    console.info({ userCount });

    return {
      typ: 'ID',
      rolle: maybeAccount.rolle,
      schulkennung: maybeAccount.schulkennung,
      bundesland: maybeAccount.bundesland,
    };
  },
  jwks: {
    keys: [],
  },
  ttl: {
    AccessToken: 60 * 60,
    AuthorizationCode: 10 * 60,
    IdToken: 60 * 60,
    RefreshToken: 14 * 24 * 60 * 60,
  },
};

// Generate a key pair for signing tokens
async function generateKeys() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  const privateJwk = await jose.exportJWK(privateKey);
  const publicJwk = await jose.exportJWK(publicKey);

  return {
    privateJwk: { ...privateJwk, use: 'sig', alg: 'RS256', kid: 'signing-key' },
    publicJwk: { ...publicJwk, use: 'sig', alg: 'RS256', kid: 'signing-key' },
  };
}

async function startServer() {
  const { privateJwk } = await generateKeys();
  // @ts-expect-error propery exists
  providerConfig.jwks.keys = [privateJwk];

  const issuerUrl = ISSUER_URL;
  const provider = new Provider(issuerUrl, providerConfig);

  if (isProduction) {
    provider.proxy = true;
  }

  // Add detailed error event handlers
  provider.on('server_error', (ctx, err) => {
    console.error('OIDC Server Error:', err);
    console.error('Error stack:', err.stack);
    console.error('Request details:', {
      method: ctx.method,
      url: ctx.url,
      headers: ctx.headers,
    });
  });

  provider.on('grant.error', (ctx, err) => {
    console.error('Grant Error:', err);
  });

  provider.on('introspection.error', (ctx, err) => {
    console.error('Introspection Error:', err);
  });

  provider.on('revocation.error', (ctx, err) => {
    console.error('Revocation Error:', err);
  });

  // Add middleware to modify token responses to match the schema
  provider.use(async (ctx, next: () => Promise<void>) => {
    // console.log(`${ctx.method} ${ctx.url}`);

    try {
      await next();

      if (ctx.oidc?.route === 'token' && ctx.body) {
        // console.log('Modifying token response');
        ctx.body.provider = 'vidis';
        ctx.body.token_type = 'bearer';

        // console.log('Token response:', JSON.stringify(ctx.body, null, 2));
      }
    } catch (err) {
      console.error('Middleware error:', err);
      throw err;
    }
  });

  app.use('/', provider.callback());

  app.listen(PORT, () => {
    console.log(`OIDC Provider running on ${ISSUER_URL}; PORT=${PORT}`);
    console.log(`OpenID Configuration at ${ISSUER_URL}/.well-known/openid-configuration`);
    console.log('\nFor use with next-auth, set the following environment variables:');
    console.log(`VIDIS_ISSUER_URI=${ISSUER_URL}`);
    console.log(`VIDIS_CLIENT_ID=${clientConfig.client_id}`);
    console.log(`VIDIS_CLIENT_SECRET=${clientConfig.client_secret}`);
  });
}

startServer()
  .then(() => {
    if (process.send) {
      process.send('ready');
    }
  })
  .catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
  });
