import { isSupportedDocumentExtension, SupportedDocumentExtension } from '@/const';
import {
  FileCsvIcon,
  FileDocIcon,
  FileHtmlIcon,
  FileIcon,
  FileMdIcon,
  FilePdfIcon,
  FilePptIcon,
  FileTextIcon,
  FileTxtIcon,
  FileXlsIcon,
  Icon,
} from '@phosphor-icons/react';

type FileIconConfig = {
  Icon: Icon;
  fillColor: string;
};

export const FILE_ICONS_DICT: Record<SupportedDocumentExtension, FileIconConfig> = {
  csv: { Icon: FileCsvIcon, fillColor: '#49AF74' },
  docx: { Icon: FileDocIcon, fillColor: '#000000' },
  htm: { Icon: FileHtmlIcon, fillColor: '#A379D6' },
  html: { Icon: FileHtmlIcon, fillColor: '#A379D6' },
  md: { Icon: FileMdIcon, fillColor: '#000000' },
  odp: { Icon: FilePptIcon, fillColor: '#FF9766' },
  ods: { Icon: FileXlsIcon, fillColor: '#49AF74' },
  odt: { Icon: FileDocIcon, fillColor: '#000000' },
  pdf: { Icon: FilePdfIcon, fillColor: '#FF0000' },
  pptx: { Icon: FilePptIcon, fillColor: '#FF9766' },
  tex: { Icon: FileTextIcon, fillColor: '#000000' },
  txt: { Icon: FileTxtIcon, fillColor: '#000000' },
  xlsx: { Icon: FileXlsIcon, fillColor: '#49AF74' },
};

export function getFileIconByFileExtension(fileExtension?: string) {
  if (fileExtension !== undefined && isSupportedDocumentExtension(fileExtension)) {
    return FILE_ICONS_DICT[fileExtension];
  }
  return { Icon: FileIcon, fillColor: '#333333' };
}
