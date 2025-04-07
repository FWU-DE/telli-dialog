import React from 'react';

export function TextIcon(props: React.ComponentProps<'svg'>) {
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
        d="M14 3V8H19L14 3ZM6 2H5H4V3V4V20L4.00002 22H6H18H20L20 20V8L14 2H6ZM6 15H16V15.6H6V15ZM16 13H6V13.6H16V13ZM6 17H16V17.6H6V17ZM12 19H6V19.6H12V19Z"
        fill="#5E6CFF"
        fillOpacity="0.95"
      />
    </svg>
  );
}
