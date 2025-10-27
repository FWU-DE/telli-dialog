import React from 'react';
import { Voucher } from '../../../../../types/voucher';

type VoucherStatus = Voucher['status'];

const translations: Record<VoucherStatus, string> = {
  created: 'Erstellt',
  redeemed: 'Eingelöst',
  revoked: 'Widerrufen',
};

export default function VoucherStatus({ status }: { status: VoucherStatus }) {
  return <span>{translations[status] || status}</span>;
}
