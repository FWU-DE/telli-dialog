import { getFileIconByFileExtension } from '../icons/file-upload-icons/file-icons-dict';
import { getFileNameAndFileExtension } from '@/utils/files/generic';

export default function MessageFileAttachment({ fileName }: { fileName: string }) {
  const [fileStem, fileExtension] = getFileNameAndFileExtension(fileName);
  const { Icon: FileIcon, fillColor: backgroundColor } = getFileIconByFileExtension(fileExtension);
  return (
    <div className="flex w-fit min-w-0 max-w-full shrink-0 items-center justify-start gap-2 py-2 pl-4 pr-6 text-sm relative group">
      <div className="absolute inset-0 opacity-5 rounded-lg" style={{ backgroundColor }} />
      <div className="relative flex h-6 min-w-0 items-center gap-2">
        <FileIcon className="h-5 w-5 shrink-0" color={backgroundColor} />
        <div className="flex min-w-0 flex-col max-w-80">
          <p className="truncate overflow-hidden text-sm" title={fileName}>
            {fileStem}
          </p>
        </div>
      </div>
    </div>
  );
}
