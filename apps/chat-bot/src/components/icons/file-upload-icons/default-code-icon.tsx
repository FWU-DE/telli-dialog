import React from 'react';

export function DefaultCodeIcon(props: React.ComponentProps<'svg'>) {
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
        d="M14 3V8H19L14 3ZM6 2H5H4V3V4V20L4.00002 22H6H18H20L20 20V8L14 2H6ZM13.8095 17.4159V18.0399L10.7695 19.3999V18.7599L13.0735 17.7279L10.7695 16.6959V16.0559L13.8095 17.4159ZM6.57422 17.4159V18.0399L9.61422 19.3999V18.7599L7.31022 17.7279L9.61422 16.6959V16.0559L6.57422 17.4159Z"
        fill="#A379D6"
        fillOpacity="0.95"
      />
    </svg>
  );
}
