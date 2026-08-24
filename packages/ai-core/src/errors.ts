/**
 * Base error class for AI generation errors.
 * Only use directly if no child error class fits the case.
 */
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

/**
 * Error thrown when a provider returns an empty or unusable generation result.
 */
export class EmptyResponseError extends AiGenerationError {
  constructor({
    modelId,
    message = 'Empty response from provider',
  }: {
    modelId: string;
    message?: string;
  }) {
    super(`${message} (modelId=${modelId})`);
    this.name = 'EmptyResponseError';
  }

  static is(error: unknown): error is EmptyResponseError {
    if (error && typeof error === 'object') {
      return 'name' in error && error.name === 'EmptyResponseError';
    }
    return false;
  }
}

/**
 * Error thrown when AI content moderation flags content as inappropriate.
 */
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

/**
 * Error thrown when the API rate limit is exceeded.
 */
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

/**
 * Error thrown when an invalid or inaccessible model is requested.
 */
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

/**
 * Error thrown when a provider is misconfigured (e.g., missing API key, invalid URL).
 */
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

/**
 * Error thrown when the user has exceeded their token points limit.
 */
export class TokenPointsExceededError extends AiGenerationError {
  constructor(message: string = 'User has reached token points limit') {
    super(message);
    this.name = 'TokenPointsExceededError';
  }

  static is(error: unknown): error is TokenPointsExceededError {
    if (error && typeof error === 'object') {
      return 'name' in error && error.name === 'TokenPointsExceededError';
    }
    return false;
  }
}

/**
 * Error thrown when the shared chat has expired.
 */
export class SharedChatExpiredError extends AiGenerationError {
  constructor(message: string = 'Shared chat has expired') {
    super(message);
    this.name = 'SharedChatExpiredError';
  }

  static is(error: unknown): error is SharedChatExpiredError {
    if (error && typeof error === 'object') {
      return 'name' in error && error.name === 'SharedChatExpiredError';
    }
    return false;
  }
}

type AiGenerationErrorType<T extends AiGenerationError = AiGenerationError> = {
  is: (error: unknown) => error is T;
};

export const aiGenerationErrorTypes = [
  AiGenerationError,
  EmptyResponseError,
  ResponsibleAIError,
  RateLimitExceededError,
  InvalidModelError,
  ProviderConfigurationError,
  TokenPointsExceededError,
  SharedChatExpiredError,
] as const satisfies ReadonlyArray<AiGenerationErrorType>;

export type KnownAiGenerationError = {
  [
    K in keyof typeof aiGenerationErrorTypes
  ]: (typeof aiGenerationErrorTypes)[K] extends AiGenerationErrorType<infer T> ? T : never;
}[number];

export function isKnownAiGenerationError(error: unknown): error is KnownAiGenerationError {
  return aiGenerationErrorTypes.some((errorType) => errorType.is(error));
}
