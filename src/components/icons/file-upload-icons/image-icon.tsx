import React from 'react';

export function ImageIcon(props: React.ComponentProps<'svg'>) {
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
        d="M14 8V3L19 8H14ZM5 2H6H14L20 8V20L20 22H18H6H4.00002L4 20V4V3V2H5ZM6 20L9.52941 14L12.0387 18.3381L13.5 16L16 20H13H11H6ZM12.7734 13.6726C13.0496 13.6726 13.2734 13.4487 13.2734 13.1726C13.2734 12.8965 13.0496 12.6726 12.7734 12.6726C12.4973 12.6726 12.2734 12.8965 12.2734 13.1726C12.2734 13.4487 12.4973 13.6726 12.7734 13.6726Z"
        fill="#EE71AE"
        fillOpacity="0.95"
      />
    </svg>
  );
}
