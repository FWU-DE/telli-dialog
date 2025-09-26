import { fetchVouchers } from '../../../services/voucher-service';

export default async function VouchersByStatePage({
  params,
}: {
  params: Promise<{ federalStateId: string }>;
}) {
  const federalStateId = (await params).federalStateId;
  const vouchers = await fetchVouchers(federalStateId);

  return (
    <div>
      <h1>Guthaben Codes für Bundesland {federalStateId}</h1>
      <a href={`/vouchers/${federalStateId}/new`}>Neuen Code erstellen</a>
      <hr />
      <ul>
        {vouchers.map((voucher) => (
          <li key={voucher.id}>
            Code: {voucher.code}, Erhöht um: {voucher.increaseAmount}ct, Dauer:{' '}
            {voucher.durationMonths} Monat(e), Status: {voucher.status}, Gültig bis:{' '}
            {new Date(voucher.validUntil).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
