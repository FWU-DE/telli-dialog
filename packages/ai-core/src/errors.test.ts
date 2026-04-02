import { describe, it, expect } from 'vitest';
import {
  AiGenerationError,
  ResponsibleAIError,
  RateLimitExceededError,
  InvalidModelError,
  ProviderConfigurationError,
  TelliPointsExceededError,
  SharedChatExpiredError,
} from './errors';

describe('AiGenerationError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new AiGenerationError('Test error');
    expect(error.name).toBe('AiGenerationError');
    expect(error.message).toBe('Test error');
    expect(error).toBeInstanceOf(Error);
  });

  it('should correctly identify AiGenerationError instances', () => {
    const error = new AiGenerationError('Test');
    expect(AiGenerationError.is(error)).toBe(true);
    expect(AiGenerationError.is(new Error('Test'))).toBe(false);
    expect(AiGenerationError.is('not an error')).toBe(false);
    expect(AiGenerationError.is(null)).toBe(false);
  });
});

describe('ResponsibleAIError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new ResponsibleAIError('Content policy violation');
    expect(error.name).toBe('ResponsibleAIError');
    expect(error.message).toBe('Content policy violation');
    expect(error).toBeInstanceOf(AiGenerationError);
  });

  it('should correctly identify ResponsibleAIError instances', () => {
    const error = new ResponsibleAIError('Test');
    expect(ResponsibleAIError.is(error)).toBe(true);
    expect(ResponsibleAIError.is(new AiGenerationError('Test'))).toBe(false);
    expect(ResponsibleAIError.is(new Error('Test'))).toBe(false);
  });
});

describe('RateLimitExceededError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new RateLimitExceededError('Too many requests');
    expect(error.name).toBe('RateLimitExceededError');
    expect(error.message).toBe('Too many requests');
    expect(error).toBeInstanceOf(AiGenerationError);
  });

  it('should correctly identify RateLimitExceededError instances', () => {
    const error = new RateLimitExceededError('Test');
    expect(RateLimitExceededError.is(error)).toBe(true);
    expect(RateLimitExceededError.is(new AiGenerationError('Test'))).toBe(false);
  });
});

describe('InvalidModelError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new InvalidModelError('Invalid model');
    expect(error.name).toBe('InvalidModelError');
    expect(error.message).toBe('Invalid model');
    expect(error).toBeInstanceOf(AiGenerationError);
  });

  it('should correctly identify InvalidModelError instances', () => {
    const error = new InvalidModelError('Test');
    expect(InvalidModelError.is(error)).toBe(true);
    expect(InvalidModelError.is(new AiGenerationError('Test'))).toBe(false);
  });
});

describe('ProviderConfigurationError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new ProviderConfigurationError('Provider not configured');
    expect(error.name).toBe('ProviderConfigurationError');
    expect(error.message).toBe('Provider not configured');
    expect(error).toBeInstanceOf(AiGenerationError);
  });

  it('should correctly identify ProviderConfigurationError instances', () => {
    const error = new ProviderConfigurationError('Test');
    expect(ProviderConfigurationError.is(error)).toBe(true);
    expect(ProviderConfigurationError.is(new AiGenerationError('Test'))).toBe(false);
  });
});

describe('TelliPointsExceededError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new TelliPointsExceededError('Points exceeded');
    expect(error.name).toBe('TelliPointsExceededError');
    expect(error.message).toBe('Points exceeded');
    expect(error).toBeInstanceOf(AiGenerationError);
  });

  it('should use the default message when none is provided', () => {
    const error = new TelliPointsExceededError();
    expect(error.message).toBe('User has reached Telli points limit');
  });

  it('should correctly identify TelliPointsExceededError instances', () => {
    const error = new TelliPointsExceededError('Test');
    expect(TelliPointsExceededError.is(error)).toBe(true);
    expect(TelliPointsExceededError.is(new AiGenerationError('Test'))).toBe(false);
    expect(TelliPointsExceededError.is(new Error('Test'))).toBe(false);
  });
});

describe('SharedChatExpiredError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new SharedChatExpiredError('Chat expired');
    expect(error.name).toBe('SharedChatExpiredError');
    expect(error.message).toBe('Chat expired');
    expect(error).toBeInstanceOf(AiGenerationError);
  });

  it('should use the default message when none is provided', () => {
    const error = new SharedChatExpiredError();
    expect(error.message).toBe('Shared chat has expired');
  });

  it('should correctly identify SharedChatExpiredError instances', () => {
    const error = new SharedChatExpiredError('Test');
    expect(SharedChatExpiredError.is(error)).toBe(true);
    expect(SharedChatExpiredError.is(new AiGenerationError('Test'))).toBe(false);
    expect(SharedChatExpiredError.is(new Error('Test'))).toBe(false);
  });
});
