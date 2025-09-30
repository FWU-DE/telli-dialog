'use client';
import SimpleTextInput from '@/components/common/simple-text-input';
import { useToast } from '@/components/common/toast';
import { dbGetVoucherByCode, dbRedeemVoucher } from '@/db/functions/voucher';
import { useTranslations } from 'next-intl';
import React from 'react';
import z from 'zod';

export default function RedeemVoucherPage({
  user,
}: {
  user: Awaited<ReturnType<typeof import('@/auth/utils').getUser>>;
}) {
  const t = useTranslations('top-up');
  const tToast = useTranslations('top-up.toasts');
  const toast = useToast();

  const [voucherCode, setVoucherCode] = React.useState('');
  const voucherSchema = z.string().length(16);

  const handleRedeem = async () => {
    if (voucherSchema.safeParse(voucherCode).success) {
      const voucher = await dbGetVoucherByCode(voucherCode);
      if (
        !voucher ||
        voucher.status !== 'created' ||
        new Date() > voucher.validUntil ||
        voucher.federalStateId !== user.federalState.id
      ) {
        toast.error(tToast('redeem-invalid'));
        return;
      }
      // Redeem the voucher
      await dbRedeemVoucher(voucherCode, user.id);
      toast.success(tToast('redeem-success'));
    }
  };

  return (
    <>
      <h2 className="font-medium mb-2">{t('title')}</h2>
      <p className="text-sm text-gray-300">{t('description')}</p>
      <div className="flex flex-row gap-4">
        <SimpleTextInput
          id="voucher"
          placeholder={t('voucher-placeholder')}
          maxLength={16}
          required
          className="flex-grow"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
        />
        <button
          className="bg-black text-white px-4 rounded-enterprise-md"
          type="button"
          onClick={handleRedeem}
          disabled={!voucherSchema.safeParse(voucherCode).success}
        >
          {t('redeem-button')}
        </button>
      </div>
    </>
  );
}
