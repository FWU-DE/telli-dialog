import React from 'react';

export type GenericFileUploadButtonProps = {
  triggerButton: React.ReactNode;
  triggerClassName?: string;
  onSubmit(files: FileList): void;
  disabled?: boolean;
};

export default function GenericFileUploadButton({
  triggerButton,
  triggerClassName,
  onSubmit,
  disabled = false,
}: GenericFileUploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleButtonClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;

    if (files === null) return;

    onSubmit(files);

    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  }

  return (
    <div className="flex items-center w-full">
      <input
        type="file"
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        className={triggerClassName}
        disabled={disabled}
      >
        {triggerButton}
      </button>
    </div>
  );
}
