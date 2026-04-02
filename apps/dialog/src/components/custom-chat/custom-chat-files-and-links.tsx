import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/Card';
import { InfoIcon } from '@phosphor-icons/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/Tooltip';
import { CustomChatFiles, CustomChatFilesProps } from './custom-chat-files';
import { CustomChatHeading2 } from './custom-chat-heading2';
import { CustomChatLinks, CustomChatLinksProps } from './custom-chat-links';
import { useTranslations } from 'next-intl';

type CustomChatFilesAndLinksProps = CustomChatFilesProps & CustomChatLinksProps;

export function CustomChatFilesAndLinks(props: CustomChatFilesAndLinksProps) {
  const t = useTranslations('assistants');

  return (
    <div className="flex flex-col gap-3 mt-10">
      <CustomChatHeading2 text={t('custom-assets-label')} tooltip={t('custom-assets-content')} />
      <Card>
        <CardHeader>
          <CardTitle>{t('custom-assets-files')}</CardTitle>
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
          <CardTitle>
            <div className="flex items-center gap-1">
              <span>{t('custom-assets-links')}</span>
              <Tooltip>
                <TooltipTrigger aria-label={t('custom-assets-links')}>
                  <InfoIcon className="size-5 text-icon" />
                </TooltipTrigger>
                <TooltipContent>{t('custom-assets-links-content')}</TooltipContent>
              </Tooltip>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomChatLinks initialLinks={props.initialLinks} onLinksChange={props.onLinksChange} />
        </CardContent>
      </Card>
    </div>
  );
}
