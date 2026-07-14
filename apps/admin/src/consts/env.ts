import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    bifrostAdminUrl: z.string().url().optional(),
    bifrostManagementApiKey: z.string().optional(),
    databaseUrl: z.string(),
    keycloakClientId: z.string(),
    keycloakClientSecret: z.string(),
    keycloakIssuer: z.string(),
  },
  client: {},
  runtimeEnv: {
    bifrostAdminUrl: process.env.BIFROST_ADMIN_URL,
    bifrostManagementApiKey: process.env.BIFROST_MANAGEMENT_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    keycloakIssuer: process.env.KEYCLOAK_ISSUER,
  },
});
