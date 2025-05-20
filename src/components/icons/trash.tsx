export default function TrashIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10 11H22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.6673 11V21.5C20.6673 22.25 20.0007 23 19.334 23H12.6673C12.0007 23 11.334 22.25 11.334 21.5V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.333 11V9.5C13.333 8.75 13.9997 8 14.6663 8H17.333C17.9997 8 18.6663 8.75 18.6663 9.5V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
