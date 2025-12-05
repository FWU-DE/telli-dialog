import { BusinessError } from './business-error';

export class UnexpectedError extends BusinessError {
  constructor(message = 'Unexpected Error') {
    super(message, 500);
    this.name = 'UnexpectedError';
  }
}

export function isUnexpectedError(error: unknown): error is UnexpectedError {
  if (error && typeof error === 'object') {
    return (
      'name' in error &&
      error.name === 'UnexpectedError' &&
      'statusCode' in error &&
      error.statusCode === 500
    );
  }
  return false;
}
