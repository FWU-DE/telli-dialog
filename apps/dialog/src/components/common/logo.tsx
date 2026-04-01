import Image from 'next/image';
import TelliLogo from '@/components/icons/logo';
import { getReadOnlySignedUrl } from '@shared/s3';
import { SEVEN_DAYS } from '@shared/s3/const';

export default async function Logo({ logoPath }: { logoPath: string | undefined }) {
  if (logoPath) {
    const signedUrl = await getReadOnlySignedUrl({
      key: logoPath,
      options: { expiresIn: SEVEN_DAYS },
    });
    if (signedUrl) return <Image src={signedUrl} alt="logo" width={150} height={150} unoptimized />;
  }

  return <TelliLogo className="text-primary" width={150} height={150} />;
}
