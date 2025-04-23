import Image from 'next/image';

export function InitialChatContentDisplay({
  title,
  imageSource,
  description,
}: {
  title: string;
  imageSource?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto p-4">
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
      <p className="max-w-full text-center">{description}</p>
    </div>
  );
}
