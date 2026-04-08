import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/Card';
import { InfoIcon } from '@phosphor-icons/react';
import { CustomChatFiles, CustomChatFilesProps } from './custom-chat-files';
import { CustomChatHeading2 } from './custom-chat-heading2';
import { CustomChatLinks, CustomChatLinksProps } from './custom-chat-links';
import { useTranslations } from 'next-intl';

type CustomChatFilesAndLinksProps = CustomChatFilesProps & CustomChatLinksProps;

export function CustomChatFilesAndLinks(props: CustomChatFilesAndLinksProps) {
  const t = useTranslations('custom-chat.files-and-links');

  return (
    <div className="flex flex-col gap-3 mt-10">
      <CustomChatHeading2 text={t('heading')} tooltip={t('heading-tooltip')} />
      <Card>
        <CardHeader>
          <CardTitle>{t('files')}</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomChatFiles
            initialFiles={props.initialFiles}
            onFileUploaded={props.onFileUploaded}
            onDeleteFile={props.onDeleteFile}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle
            tooltipAriaLabel={t('links')}
            tooltipContent={t('links-tooltip')}
            tooltipIcon={<InfoIcon className="size-5 text-icon" />}
          >
            {t('links')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomChatLinks initialLinks={props.initialLinks} onLinksChange={props.onLinksChange} />
        </CardContent>
      </Card>
    </div>
  );
}
