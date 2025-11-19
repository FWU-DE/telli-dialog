export class UnauthenticatedError extends Error {
  statusCode = 401;
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}
