export type FileFile = { type: 'file'; fileObject: File };
export type ImageFile = { type: 'image'; imageUrl: string | undefined };

export type PendingLocalFileState = {
  status: 'pending';
  file: FileFile | ImageFile;
};

export type ErrorLocalFileState = {
  status: 'error';
  file: FileFile | ImageFile;
};

export type SuccessLocalFileState = {
  status: 'success';
  file: FileFile | ImageFile;
  id: string;
};

export type LocalFileState = PendingLocalFileState | ErrorLocalFileState | SuccessLocalFileState;
export type FileStatus = LocalFileState['status'];
