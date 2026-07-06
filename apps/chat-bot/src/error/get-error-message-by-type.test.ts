import {
  InvalidModelError,
  ResponsibleAIError,
  SharedChatExpiredError,
  TokenPointsExceededError,
} from '@ais-chat/ai-core/errors';
import { NotFoundError } from '@shared/error/not-found-error';
import { describe, expect, it } from 'vitest';
import { getErrorMessageByType } from './get-error-message-by-type';

describe('getErrorMessageByType', () => {
  it('returns key for mapped ai-core errors', () => {
    expect(getErrorMessageByType(new TokenPointsExceededError())).toBe('rate-limit-error');
    expect(getErrorMessageByType(new SharedChatExpiredError())).toBe('chat-expired-error');
  });

  it('returns not-found key for NotFoundError', () => {
    expect(getErrorMessageByType(new NotFoundError('Not found'))).toBe('not-found-error');
  });

  it('returns generic key for known but unmapped ai-core errors', () => {
    expect(getErrorMessageByType(new ResponsibleAIError('Policy violation'))).toBe('generic-error');
    expect(getErrorMessageByType(new InvalidModelError('Invalid model'))).toBe('generic-error');
  });

  it('returns generic key for unknown values', () => {
    expect(getErrorMessageByType(new Error('Oops'))).toBe('generic-error');
    expect(getErrorMessageByType('not an error')).toBe('generic-error');
    expect(getErrorMessageByType(null)).toBe('generic-error');
  });
});
