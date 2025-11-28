export class VoucherAlreadyRedeemedError extends Error {
  statusCode = 400;
  constructor(message = 'Voucher already redeemed and cannot be modified') {
    super(message);
    this.name = 'VoucherAlreadyRedeemedError';
  }
}
export function isVoucherAlreadyRedeemedError(error: unknown): error is VoucherAlreadyRedeemedError {
  if (error && typeof error === 'object') {
    return (
      'name' in error &&
      error.name === 'VoucherAlreadyRedeemedError' &&
      'statusCode' in error &&
      (error as any).statusCode === 400
    );
  }
  return false;
}
