import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/Card';
import { CustomChatFiles, CustomChatFilesProps } from './custom-chat-files';
import { CustomChatHeading2 } from './custom-chat-heading2';
import { CustomChatLinks, CustomChatLinksProps } from './custom-chat-links';

type CustomChatFilesAndLinksProps = CustomChatFilesProps & CustomChatLinksProps;

export function CustomChatFilesAndLinks(props: CustomChatFilesAndLinksProps) {
  return (
    <div className="flex flex-col gap-3 mt-10">
      <CustomChatHeading2 text="Hintergrundwissen" tooltip="Platzhaltertext" />
      <Card>
        <CardHeader>
          <CardTitle>Dateien</CardTitle>
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
          <CardTitle>Webseiten</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomChatLinks initialLinks={props.initialLinks} onLinksChange={props.onLinksChange} />
        </CardContent>
      </Card>
    </div>
  );
}
