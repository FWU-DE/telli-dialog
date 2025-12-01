import { BusinessError } from './business-error';

export class InvalidArgumentError extends BusinessError {
  constructor(message = 'Argument is invalid') {
    super(message, 400);
    this.name = 'InvalidArgumentError';
  }
}
export function isInvalidArgumentError(error: unknown): error is InvalidArgumentError {
  if (error && typeof error === 'object') {
    return (
      'name' in error &&
      error.name === 'InvalidArgumentError' &&
      'statusCode' in error &&
      error.statusCode === 400
    );
  }
  return false;
}
