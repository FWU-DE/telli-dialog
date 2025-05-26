import React from 'react';
import SearchIcon from './icons/search';
import { cn } from '@/utils/tailwind';

type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function SearchBarInput({ ...props }: SearchInputProps) {
  return (
    <div
      className={cn(
        'relative flex items-center border-[1px] disabled:cursor-not-allowed disabled:bg-light-gray disabled:border-gray-100 focus-within:border-primary rounded-enterprise-md overflow-hidden group',
        props.disabled && 'bg-light-gray border-gray-100',
      )}
    >
      <input {...props} className={cn(props.className, 'min-w-60 pr-10')} />
      <div
        className={cn(
          'pl-8 absolute right-4 bottom-3',
          'disabled:bg-light-gray disabled:border-gray-100',
        )}
      >
        <SearchIcon className="w-4 h-4 text-gray-400 group-focus-within:text-primary " />
      </div>
    </div>
  );
}
