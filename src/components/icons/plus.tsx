export default function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.7619 0.761905C8.7619 0.34112 8.42078 0 8 0C7.57922 0 7.2381 0.34112 7.2381 0.761905V7.2381H0.761905C0.34112 7.2381 0 7.57922 0 8C0 8.42078 0.34112 8.7619 0.761905 8.7619H7.2381V15.2381C7.2381 15.6588 7.57922 16 8 16C8.42078 16 8.7619 15.6588 8.7619 15.2381V8.7619H15.2381C15.6588 8.7619 16 8.42078 16 8C16 7.57922 15.6588 7.2381 15.2381 7.2381H8.7619V0.761905Z"
      />
    </svg>
  );
}
