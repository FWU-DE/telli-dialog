import Image from 'next/image';
import MarkdownDisplay from './markdown-display';

export function InitialChatContentDisplay({
  title,
  imageSource,
  description,
  excerciseDescription,
  setDialogStarted,
}: {
  title: string;
  imageSource?: string;
  description?: string;
  excerciseDescription?: string;
  setDialogStarted?: (dialogStarted: boolean) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto p-4 gap-1">
      {imageSource !== undefined && (
        <Image
          src={imageSource}
          width={100}
          height={100}
          alt={title}
          className="rounded-enterprise-md"
        />
      )}
      <h1 className="text-2xl font-medium mt-8 text-center">{title}</h1>
      {description !== undefined && description.trim() !== '' && (
        <p className="max-w-full text-center">{description}</p>
      )}
      {excerciseDescription !== undefined && excerciseDescription.trim() !== '' && (
        <div className="max-w-full min-w-[50%] m-4 border-primary border-2 rounded-enterprise-md p-4 ">
          <MarkdownDisplay>{excerciseDescription}</MarkdownDisplay>
        </div>
      )}
      {setDialogStarted !== undefined && (
        <button
          className="bg-primary text-white px-4 py-2 rounded-enterprise-full"
          onClick={() => setDialogStarted(true)}
        >
          Dialog starten
        </button>
      )}
    </div>
  );
}
