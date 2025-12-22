// Only use if no child errors fit the case
export class AiGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiGenerationError';
  }

  static is(error: unknown): error is AiGenerationError {
    if (error && typeof error === 'object') {
      return 'name' in error && error.name === 'AiGenerationError';
    }
    return false;
  }
}
export class ResponsibleAIError extends AiGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'ResponsibleAIError';
  }

  static is(error: unknown): error is ResponsibleAIError {
    if (error && typeof error === 'object') {
      return 'name' in error && error.name === 'ResponsibleAIError';
    }
    return false;
  }
}
export class RateLimitExceededError extends AiGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitExceededError';
  }

  static is(error: unknown): error is RateLimitExceededError {
    if (error && typeof error === 'object') {
      return 'name' in error && error.name === 'RateLimitExceededError';
    }
    return false;
  }
}
export class InvalidModelError extends AiGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidModelError';
  }

  static is(error: unknown): error is InvalidModelError {
    if (error && typeof error === 'object') {
      return 'name' in error && error.name === 'InvalidModelError';
    }
    return false;
  }
}

export class ProviderConfigurationError extends AiGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigurationError';
  }

  static is(error: unknown): error is ProviderConfigurationError {
    if (error && typeof error === 'object') {
      return 'name' in error && error.name === 'ProviderConfigurationError';
    }
    return false;
  }
}
