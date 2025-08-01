import { MouseEventHandler } from 'react';

export type ButtonProps = {
  children: React.ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
};

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 hover:cursor-pointer"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
