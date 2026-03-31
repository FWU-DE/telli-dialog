import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function CustomChatShareInfo({
  href,
  variant,
}: {
  href: string;
  variant: 'assistants' | 'learning-scenarios' | 'characters';
}) {
  const t = useTranslations(variant);
  return (
    <div className="flex px-6 py-4 justify-between text-base font-medium rounded-xl bg-secondary/40">
      <span className="">{t('sharing-info')}</span>
      <Link href={href}>
        <span className="text-primary">{t('sharing-settings')}</span>
      </Link>
    </div>
  );
}
