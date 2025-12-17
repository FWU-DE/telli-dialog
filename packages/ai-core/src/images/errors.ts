// Only use if no child errors fit the case
export class ImageGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageGenerationError';
  }

  static is(error: unknown): error is ImageGenerationError {
    return error instanceof Error && error.name === 'ImageGenerationError';
  }
}
export class ResponsibleAIError extends ImageGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'ResponsibleAIError';
  }

  static is(error: unknown): error is ResponsibleAIError {
    return error instanceof Error && error.name === 'ResponsibleAIError';
  }
}
export class RateLimitExceededError extends ImageGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitExceededError';
  }

  static is(error: unknown): error is RateLimitExceededError {
    return error instanceof Error && error.name === 'RateLimitExceededError';
  }
}
export class InvalidImageModelError extends ImageGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidImageModelError';
  }

  static is(error: unknown): error is InvalidImageModelError {
    return error instanceof Error && error.name === 'InvalidImageModelError';
  }
}
export class ProviderConfigurationError extends ImageGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigurationError';
  }

  static is(error: unknown): error is ProviderConfigurationError {
    return error instanceof Error && error.name === 'ProviderConfigurationError';
  }
}
