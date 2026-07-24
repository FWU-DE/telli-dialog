import { describe, expect, it } from 'vitest';
import { llmModelSettingsGoogleSchema } from './schema';

describe('llmModelSettingsGoogleSchema', () => {
  it('accepts a string or object authCredentials value', () => {
    expect(
      llmModelSettingsGoogleSchema.safeParse({
        provider: 'google',
        projectId: 'project-id',
        location: 'europe-west3',
        authCredentials: 'raw-credentials',
      }).success,
    ).toBe(true);

    expect(
      llmModelSettingsGoogleSchema.safeParse({
        provider: 'google',
        projectId: 'project-id',
        location: 'europe-west3',
        authCredentials: {
          type: 'service_account',
          client_email: 'test@example.com',
        },
      }).success,
    ).toBe(true);
  });

  it('rejects non-string, non-object authCredentials values', () => {
    expect(
      llmModelSettingsGoogleSchema.safeParse({
        provider: 'google',
        projectId: 'project-id',
        location: 'europe-west3',
        authCredentials: 123,
      }).success,
    ).toBe(false);
  });
});
