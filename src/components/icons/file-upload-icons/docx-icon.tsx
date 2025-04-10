import React from 'react';

export function WordIcon(props: React.ComponentProps<'svg'>) {
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
        d="M14 8V3L19 8H14ZM5 2H6H14L20 8V20L20 22H18H6H4.00002L4 20V4V3V2H5ZM6.95066 14.3999H6.22266L7.85466 19.9999H8.68666L9.95866 15.5599L11.2387 19.9999H12.0707L13.7107 14.3999H12.9907L11.6707 19.1039L10.3427 14.3999H9.63866L8.26266 19.1039L6.95066 14.3999Z"
        fill="#5E6CFF"
        fillOpacity="0.95"
      />
    </svg>
  );
}
