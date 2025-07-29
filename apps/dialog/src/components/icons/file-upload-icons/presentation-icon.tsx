import React from 'react';

export function PresentationIcon(props: React.ComponentProps<'svg'>) {
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
        d="M14 8V3L19 8H14ZM5 2H6H14L20 8V20L20 22H18H6H4.00002L4 20V4V3V2H5ZM6 14.5048H8.01905C8.01905 14.3709 8.07223 14.2425 8.16689 14.1478C8.26155 14.0532 8.38994 14 8.52381 14C8.65768 14 8.78607 14.0532 8.88073 14.1478C8.97539 14.2425 9.02857 14.3709 9.02857 14.5048H11.0476V15.0095H10.7952V17.7857H9.34405L9.78571 19.3H9.28095L8.83929 17.7857H8.20833L7.76667 19.3H7.2619L7.70357 17.7857H6.25238V15.0095H6V14.5048ZM6.75714 17.281V17.2809H10.2892V15.0095H10.2905V17.281H6.75714Z"
        fill="#FF9766"
        fillOpacity="0.95"
      />
    </svg>
  );
}
