import React from 'react';

export function DefaultIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 3V8H19L14 3ZM6 2H5H4V3V4V20L4.00002 22H6H18H20L20 20V8L14 2H6Z"
        fill="#333333"
        fillOpacity="0.95"
      />
    </svg>
  );
}
