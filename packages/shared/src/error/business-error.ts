export abstract class BusinessError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
  }
}
