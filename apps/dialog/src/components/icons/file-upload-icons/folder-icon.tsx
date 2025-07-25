import React from 'react';

export function FolderIcon(props: React.ComponentProps<'svg'>) {
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
        d="M6.60369 5H10.1986L11.9982 6.79965H17.4016H18.4016H19.1968H20.0009H21.0009V7.79965V8.49912V9.49912H20.9965V17.5975V19.3972H19.1968H4.79965H3.00367C3.0036 19.1832 3.00276 18.8735 3.00191 18.5562C3.00097 18.2066 3 17.8478 3 17.5975V6.79965C3 6.7567 3.00148 6.71412 3.00439 6.67195V6V5H4.00439H4.79965H5.60369H6.60369Z"
        fill="#333333"
        fillOpacity="0.95"
      />
    </svg>
  );
}
