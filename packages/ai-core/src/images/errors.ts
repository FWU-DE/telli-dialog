// Only use if no child errors fit the case
export class ImageGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageGenerationError';
  }

  static is(error: unknown): error is ImageGenerationError {
    if (error && typeof error === 'object') {
      return (
        'name' in error &&
        error.name === 'ImageGenerationError');
    }
    return false;
  }
}
export class ResponsibleAIError extends ImageGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'ResponsibleAIError';
  }

  static is(error: unknown): error is ResponsibleAIError {
    if (error && typeof error === 'object') {
      return (
        'name' in error &&
        error.name === 'ResponsibleAIError');
    }
    return false;
  }
}
export class RateLimitExceededError extends ImageGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitExceededError';
  }

  static is(error: unknown): error is RateLimitExceededError {
    if (error && typeof error === 'object') {
      return (
        'name' in error &&
        error.name === 'RateLimitExceededError');
    }
    return false;
  }
}
export class InvalidImageModelError extends ImageGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidImageModelError';
  }

  static is(error: unknown): error is InvalidImageModelError {
    if (error && typeof error === 'object') {
      return (
        'name' in error &&
        error.name === 'InvalidImageModelError');
    }
    return false;
  }
}
export class ProviderConfigurationError extends ImageGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigurationError';
  }

  static is(error: unknown): error is ProviderConfigurationError {
    if (error && typeof error === 'object') {
      return (
        'name' in error &&
        error.name === 'ProviderConfigurationError');
    }
    return false;
  }
}
