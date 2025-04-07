import React from 'react';
import { FileStatus } from './upload-file-button';

import ParagraphWithConditionalTitle from './paragraph-with-conditional-title';
import { getFileIconByFileExtension } from '../icons/file-upload-icons/file-icons-dict';
import DeattachFileIcon from '../icons/file-upload-icons/deattach-file-icon';
import Spinner from '../icons/spinner';
import CrossIcon from '../icons/cross';
import { getFileExtension } from '@/utils/files/generic';

type DisplayUploadedFileProps = {
  fileName: string;
  status: FileStatus;
  onDeattachFile?: () => void;
  fileId?: string;
};

export default function DisplayUploadedFile({
  fileName,
  status,
  onDeattachFile,
  fileId,
}: DisplayUploadedFileProps) {
  const file_extension = getFileExtension(fileName);

  const { Icon: FileIcon, fillColor: backgroundColor } = getFileIconByFileExtension(file_extension);

  
  // TODO: this shoulld only be a button if the fileId is present and otherwise just a div

  return (
    <div
      className="flex items-center justify-left gap-2 text-sm relative group py-4 pr-6 pl-4 shrink-0 max-w-[300px] min-w-[100px]"
    >
      <div className="absolute inset-0 opacity-5" style={{ backgroundColor }} />
      {onDeattachFile !== undefined && (
        <button onClick={onDeattachFile} className="absolute right-0 top-0 hover:bg-neutral-200">
          <DeattachFileIcon />
        </button>
      )}
      <div className="relative flex items-center gap-2 h-[24px]">
        {status === 'processed' && <FileIcon className="w-8 h-8" />}
        {status === 'uploading' && <Spinner className="w-5 h-5" />}
        {status === 'failed' && <CrossIcon className="w-5 h-5" />}
        <div className="flex flex-col">
          <ParagraphWithConditionalTitle content={fileName} />
          <span className="text-left text-gray-100 font-normal text-[10px]">{`.${getFileExtension(fileName)}`}</span>
        </div>
      </div>
    </div>
  );
}
