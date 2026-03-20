import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/Card';
import { CustomChatFiles, CustomChatFilesProps } from './custom-chat-files';
import { CustomChatHeading2 } from './custom-chat-heading2';

type CustomChatFilesAndLinksProps = CustomChatFilesProps;

export function CustomChatFilesAndLinks(props: CustomChatFilesAndLinksProps) {
  return (
    <div>
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
          <div>Platzhalter für Weblinks</div>
        </CardContent>
      </Card>
    </div>
  );
}
