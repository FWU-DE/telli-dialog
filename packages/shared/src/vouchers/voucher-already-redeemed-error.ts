import { BusinessError } from '../error/business-error';

export class VoucherAlreadyRedeemedError extends BusinessError {
  constructor(message = 'Voucher already redeemed and cannot be modified') {
    super(message, 400);
    this.name = 'VoucherAlreadyRedeemedError';
  }
}
export function isVoucherAlreadyRedeemedError(
  error: unknown,
): error is VoucherAlreadyRedeemedError {
  if (error && typeof error === 'object') {
    return (
      'name' in error &&
      error.name === 'VoucherAlreadyRedeemedError' &&
      'statusCode' in error &&
      error.statusCode === 400
    );
  }
  return false;
}
