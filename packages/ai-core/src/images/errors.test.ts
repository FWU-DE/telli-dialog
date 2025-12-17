import { describe, it, expect } from 'vitest';
import {
  ImageGenerationError,
  ResponsibleAIError,
  RateLimitExceededError,
  InvalidImageModelError,
  ProviderConfigurationError,
} from './errors';

describe('ImageGenerationError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new ImageGenerationError('Test error');
    expect(error.name).toBe('ImageGenerationError');
    expect(error.message).toBe('Test error');
    expect(error).toBeInstanceOf(Error);
  });

  it('should correctly identify ImageGenerationError instances', () => {
    const error = new ImageGenerationError('Test');
    expect(ImageGenerationError.is(error)).toBe(true);
    expect(ImageGenerationError.is(new Error('Test'))).toBe(false);
    expect(ImageGenerationError.is('not an error')).toBe(false);
    expect(ImageGenerationError.is(null)).toBe(false);
  });
});

describe('ResponsibleAIError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new ResponsibleAIError('Content policy violation');
    expect(error.name).toBe('ResponsibleAIError');
    expect(error.message).toBe('Content policy violation');
    expect(error).toBeInstanceOf(ImageGenerationError);
  });

  it('should correctly identify ResponsibleAIError instances', () => {
    const error = new ResponsibleAIError('Test');
    expect(ResponsibleAIError.is(error)).toBe(true);
    expect(ResponsibleAIError.is(new ImageGenerationError('Test'))).toBe(false);
    expect(ResponsibleAIError.is(new Error('Test'))).toBe(false);
  });
});

describe('RateLimitExceededError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new RateLimitExceededError('Too many requests');
    expect(error.name).toBe('RateLimitExceededError');
    expect(error.message).toBe('Too many requests');
    expect(error).toBeInstanceOf(ImageGenerationError);
  });

  it('should correctly identify RateLimitExceededError instances', () => {
    const error = new RateLimitExceededError('Test');
    expect(RateLimitExceededError.is(error)).toBe(true);
    expect(RateLimitExceededError.is(new ImageGenerationError('Test'))).toBe(false);
  });
});

describe('InvalidImageModelError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new InvalidImageModelError('Invalid model');
    expect(error.name).toBe('InvalidImageModelError');
    expect(error.message).toBe('Invalid model');
    expect(error).toBeInstanceOf(ImageGenerationError);
  });

  it('should correctly identify InvalidImageModelError instances', () => {
    const error = new InvalidImageModelError('Test');
    expect(InvalidImageModelError.is(error)).toBe(true);
    expect(InvalidImageModelError.is(new ImageGenerationError('Test'))).toBe(false);
  });
});

describe('ProviderConfigurationError', () => {
  it('should create an error with the correct name and message', () => {
    const error = new ProviderConfigurationError('Provider not configured');
    expect(error.name).toBe('ProviderConfigurationError');
    expect(error.message).toBe('Provider not configured');
    expect(error).toBeInstanceOf(ImageGenerationError);
  });

  it('should correctly identify ProviderConfigurationError instances', () => {
    const error = new ProviderConfigurationError('Test');
    expect(ProviderConfigurationError.is(error)).toBe(true);
    expect(ProviderConfigurationError.is(new ImageGenerationError('Test'))).toBe(false);
  });
});
