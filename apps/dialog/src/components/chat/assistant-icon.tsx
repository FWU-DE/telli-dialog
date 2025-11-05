import { cn } from '@/utils/tailwind';
import { HELP_MODE_GPT_ID } from '@shared/db/const';
import RobotIcon from '../icons/robot';
import Image from 'next/image';

export function AssistantIcon({
  customGptId: customGptId,
  imageName,
  imageSource,
  className,
}: {
  customGptId?: string;
  imageName?: string;
  imageSource?: string;
  className?: string;
}) {
  if (customGptId === HELP_MODE_GPT_ID) {
    return (
      <div className="rounded-enterprise-sm bg-secondary/5 w-8 h-8 place-self-start m-4 mt-1">
        <RobotIcon className="w-8 h-8 text-primary p-1" />
      </div>
    );
  }
  if (imageSource !== undefined && imageName !== undefined) {
    return (
      <div className={cn('p-1.5 place-self-start mx-4 mt-1 ', className)}>
        <Image
          src={imageSource}
          width={30}
          height={30}
          alt={imageName}
          className="rounded-enterprise-sm"
          // this is necessary for it rendering correctly in safari
          style={{
            minWidth: '2.5rem',
            objectFit: 'cover',
          }}
        />
      </div>
    );
  }
}
