import Provider, { Configuration } from 'oidc-provider';
import express from 'express';
import crypto from 'crypto';
import * as jose from 'jose';

const accountIdAccountMapping: Record<
  string,
  { sub: string; schulkennung: string; rolle: string; bundesland: string }
> = {
  teacher: {
    sub: 'f4830567-2ca9-4b9c-9c27-1900d443c07c',
    schulkennung: 'school1',
    rolle: 'LEHR',
    bundesland: 'DE-BY',
  },
  student: {
    sub: '322594dc-548c-45be-b880-fda58fe863d3b',
    schulkennung: 'school1',
    rolle: 'LERN',
    bundesland: 'DE-BY',
  },
};

// Create express app
const app = express();

// Create a simple PKCE-enabled client configuration
const clientConfig = {
  client_id: 'vidis-client', // Should match env.vidisClientId in your next-auth config
  client_secret: 'vidis-secret', // Should match env.vidisClientSecret in your next-auth config
  redirect_uris: ['http://localhost:3000/api/auth/callback/vidis'], // Update to match your next-auth callback
  response_types: ['code'],
  grant_types: ['authorization_code', 'refresh_token'],
  token_endpoint_auth_method: 'client_secret_basic',
} satisfies NonNullable<Configuration['clients']>[number];

// OIDC provider configuration
const providerConfig: Configuration = {
  clients: [clientConfig],
  pkce: {
    methods: ['S256'], // Support PKCE
    required: () => true, // Require PKCE for all clients
  },
  features: {
    devInteractions: { enabled: true },
    // Disable session management - this might be causing the issue
  },
  conformIdTokenClaims: false, // Allow custom claims in ID token
  cookies: {
    keys: ['some-secure-key'],
    // Completely simplified cookie settings
    long: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Explicitly set to false for local development
    },
    short: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Explicitly set to false for local development
    },
  },
  claims: {
    openid: ['sub', 'rolle', 'schulkennung', 'bundesland'],
  },
  // This helper finds the user account
  async findAccount(ctx: any, id: string) {
    console.log('findAccount called with id:', id);

    const maybeAccount = accountIdAccountMapping[id];
    if (maybeAccount === undefined) {
      throw Error(`Expected teacher or student but got '${id}'`);
    }
    // Return a mock account that matches your schema requirements
    return {
      accountId: id, // This will be the 'sub' claim
      async claims(use: string, scope: string) {
        console.log('claims called with use:', use, 'scope:', scope);
        return {
          sub: maybeAccount.sub,
          rolle: 'lehrer',
          schulkennung: ['123456', '789012'], // Array as per your schema
          bundesland: 'berlin',
        };
      },
    };
  },
  // Add custom claims to the tokens
  async extraTokenClaims(ctx, token) {
    console.debug({ ctx, token });
    console.log('extraTokenClaims called');
    const maybeAccount = accountIdAccountMapping[token.accountId];
    if (maybeAccount === undefined) {
      throw Error(`Expected teacher or student but got '${token.accountId}'`);
    }

    return {
      typ: 'ID',
      rolle: maybeAccount.rolle,
      schulkennung: maybeAccount.schulkennung,
      bundesland: maybeAccount.bundesland,
    };
  },
  jwks: {
    keys: [], // Will be populated with generated keys
  },
  // Add custom format types
  formats: {
    AccessToken: 'jwt',
  },
  // Simplify expiration times
  ttl: {
    AccessToken: 60 * 60, // 1 hour
    AuthorizationCode: 10 * 60, // 10 minutes
    IdToken: 60 * 60, // 1 hour
    RefreshToken: 14 * 24 * 60 * 60, // 14 days
  },
};

// Generate a key pair for signing tokens
async function generateKeys() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  const privateJwk = await jose.exportJWK(privateKey as any);
  const publicJwk = await jose.exportJWK(publicKey as any);

  return {
    privateJwk: { ...privateJwk, use: 'sig', alg: 'RS256', kid: 'signing-key' },
    publicJwk: { ...publicJwk, use: 'sig', alg: 'RS256', kid: 'signing-key' },
  };
}

// Start the server
async function startServer() {
  // Generate keys and add to configuration
  const { privateJwk } = await generateKeys();
  providerConfig.jwks.keys = [privateJwk];

  // Create provider instance
  const issuerUrl = 'http://localhost:9000'; // Should match env.vidisIssuerUri in your next-auth config
  const provider = new Provider(issuerUrl, providerConfig);

  // Add detailed error event handlers
  provider.on('server_error', (ctx, err) => {
    console.error('OIDC Server Error:', err);
    console.error('Error stack:', err.stack);
    console.error('Request details:', {
      method: ctx.method,
      url: ctx.url,
      headers: ctx.headers,
      body: ctx.request.body,
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
  provider.use(async (ctx: any, next: () => Promise<void>) => {
    // Add request logging
    console.log(`${ctx.method} ${ctx.url}`);

    try {
      await next();

      // For token endpoint responses, add the 'provider' field
      if (ctx.oidc?.route === 'token' && ctx.body) {
        console.log('Modifying token response');
        ctx.body.provider = 'vidis';
        ctx.body.token_type = 'bearer';

        console.log('Token response:', JSON.stringify(ctx.body, null, 2));
      }
    } catch (err) {
      console.error('Middleware error:', err);
      throw err;
    }
  });

  // Mount the OIDC provider
  app.use('/', provider.callback());

  // Start the server
  app.listen(9000, () => {
    console.log('OIDC Provider running on http://localhost:9000');
    console.log('OpenID Configuration at http://localhost:9000/.well-known/openid-configuration');
    console.log('\nFor use with next-auth, set the following environment variables:');
    console.log(`VIDIS_ISSUER_URI=http://localhost:9000`);
    console.log(`VIDIS_CLIENT_ID=${clientConfig.client_id}`);
    console.log(`VIDIS_CLIENT_SECRET=${clientConfig.client_secret}`);
  });
}

// Run the server
startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
