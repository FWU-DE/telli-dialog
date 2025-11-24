export abstract class BusinessError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
  }
}

// write type guard for BusinessError without using instanceof
export function isBusinessError(error: unknown): error is BusinessError {
  return (
    !!error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    'message' in error &&
    'name' in error
  );
}
