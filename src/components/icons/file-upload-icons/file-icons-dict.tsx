import React from 'react';
import { PdfIcon } from './pdf-icon';
import { WordIcon } from './docx-icon';
import { PythonIcon } from './python-icon';
import { JavaScriptIcon } from './js-icon';
import { TextIcon } from './txt-icon';
import { XlsxIcon } from './xlsx-icon';
import { PresentationIcon } from './presentation-icon';
import { PowerPointIcon } from './power-point-icon';
import { DefaultIcon } from './default-file-icon';
import { DefaultCodeIcon } from './default-code-icon';
import { DatabaseIcon } from './database-icon';
import { ArchiveIcon } from './archive-icon';
import { CSVFileIcon } from './csv-icon';

export const FILE_ICONS_DICT = {
  pdf: { Icon: PdfIcon, fillColor: '#F06A5D' },
  docx: { Icon: WordIcon, fillColor: '#5E6CFF' },
  py: { Icon: PythonIcon, fillColor: '#A379D6' },
  js: { Icon: JavaScriptIcon, fillColor: '#A379D6' },
  txt: { Icon: TextIcon, fillColor: '#5E6CFF' },
  xlsx: { Icon: XlsxIcon, fillColor: '#49AF74' },
  csv: { Icon: CSVFileIcon, fillColor: '#49AF74' },
  ppt: { Icon: PresentationIcon, fillColor: '#FF9766' },
  pptx: { Icon: PowerPointIcon, fillColor: '#FF9766' },
  html: { Icon: DefaultCodeIcon, fillColor: '#A379D6' },
  db: { Icon: DatabaseIcon, fillColor: '#FFDC84' },
  zip: { Icon: ArchiveIcon, fillColor: '#FFDC84' },
} as const;

export function isValidFileExtension(fileExtension: string): fileExtension is FileIconExtension {
  if (Object.keys(FILE_ICONS_DICT).includes(fileExtension)) return true;
  return false;
}

export type FileIconExtension = keyof typeof FILE_ICONS_DICT;

type FileIconType = React.ComponentType<React.ComponentProps<'svg'>>;

export function getFileIconByFileExtension(fileExtension: string): {
  Icon: FileIconType;
  fillColor: string;
} {
  if (isValidFileExtension(fileExtension)) {
    return FILE_ICONS_DICT[fileExtension];
  }
  return { Icon: DefaultIcon, fillColor: '#333333' };
}
