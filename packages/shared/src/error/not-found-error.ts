export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
