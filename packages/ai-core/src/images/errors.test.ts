import { describe, it, expect } from 'vitest';
import {
  AiGenerationError,
  ResponsibleAIError,
  RateLimitExceededError,
  InvalidModelError,
  ProviderConfigurationError,
} from '../errors';

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
