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
        d="M14 8V3L19 8H14ZM5 2H6H14L20 8V20L20 22H18H6H4.00002L4 20V4V3V2H5ZM9.88889 16.2778V17.25L11 16.1389V19.1944L9.88889 18.0833V19.0556C9.88889 19.1292 9.85962 19.1999 9.80753 19.252C9.75544 19.3041 9.68478 19.3333 9.61111 19.3333H6.27778C6.20411 19.3333 6.13345 19.3041 6.08136 19.252C6.02927 19.1999 6 19.1292 6 19.0556V16.2778C6 16.2041 6.02927 16.1335 6.08136 16.0814C6.13345 16.0293 6.20411 16 6.27778 16H9.61111C9.68478 16 9.75544 16.0293 9.80753 16.0814C9.85962 16.1335 9.88889 16.2041 9.88889 16.2778Z"
        fill="#EE71AE"
        fillOpacity="0.95"
      />
    </svg>
  );
}
