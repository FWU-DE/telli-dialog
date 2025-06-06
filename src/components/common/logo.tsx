import { getMaybeLogoFromS3 } from '@/s3';
import Image from 'next/image';
import TelliLogo from '@/components/icons/logo';

export default async function Logo({ federalStateId }: { federalStateId: string | undefined }) {
  const logoPath = await getMaybeLogoFromS3(federalStateId, 'logo.jpg');
  const logoElement = logoPath ? (
    <Image src={logoPath} alt="logo" width={150} height={150} />
  ) : (
    <TelliLogo className="text-primary" width={150} height={150} />
  );
  return logoElement;
}
