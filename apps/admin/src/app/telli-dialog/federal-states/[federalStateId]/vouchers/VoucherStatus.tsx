import React from 'react';
import { VoucherModel } from '@telli/shared/vouchers/voucher';

type VoucherStatus = VoucherModel['status'];

const translations: Record<VoucherStatus, string> = {
  created: 'Erstellt',
  redeemed: 'Eingelöst',
  revoked: 'Widerrufen',
};

export default function VoucherStatus({ status }: { status: VoucherStatus }) {
  return <span>{translations[status] || status}</span>;
}
