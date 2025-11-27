export class VoucherAlreadyRedeemedError extends Error {
  statusCode = 400;
  constructor(message = 'Voucher already redeemed and cannot be modified') {
    super(message);
    this.name = 'VoucherAlreadyRedeemedError';
  }
}
