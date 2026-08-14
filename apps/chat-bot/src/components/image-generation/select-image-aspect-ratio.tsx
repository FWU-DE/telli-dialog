'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components/dropdown-menu';
import { useImageAspectRatio } from './image-aspect-ratio-provider';
import { RectangleIcon, SquareIcon } from '@phosphor-icons/react';

export default function SelectImageAspectRatio() {
  const { aspectRatio, setAspectRatio } = useImageAspectRatio();

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button">Seitenverhältnis auswählen: {aspectRatio}</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <SquareIcon />
            <button onClick={() => setAspectRatio('quadratic')}>Quadratisch</button>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RectangleIcon style={{ transform: 'rotate(90deg)' }} />
            <button onClick={() => setAspectRatio('portrait')}>Hochformat</button>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RectangleIcon />
            <button onClick={() => setAspectRatio('landscape')}>Querformat</button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
