import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    databaseUrl: z.string(),
    keycloakClientId: z.string(),
    keycloakClientSecret: z.string(),
    keycloakIssuer: z.string(),
    telliDialogApiKey: z.string(),
    telliDialogBaseUrl: z.url('BASE_URL_TELLI_DIALOG must be a valid URL'),
    telliApiApiKey: z.string(),
    telliApiBaseUrl: z.url('BASE_URL_TELLI_API must be a valid URL'),
  },
  client: {},
  runtimeEnv: {
    databaseUrl: process.env.DATABASE_URL,
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    keycloakIssuer: process.env.KEYCLOAK_ISSUER,
    telliDialogApiKey: process.env.API_KEY_TELLI_DIALOG,
    telliDialogBaseUrl: process.env.BASE_URL_TELLI_DIALOG,
    telliApiApiKey: process.env.API_KEY_TELLI_API,
    telliApiBaseUrl: process.env.BASE_URL_TELLI_API,
  },
});
