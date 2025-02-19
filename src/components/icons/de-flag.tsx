export default function DeFlagIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="21"
      viewBox="0 0 18 21"
      fill="none"
      {...props}
    >
      <mask
        id="mask0_1847_1401"
        mask-type="alpha"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="18"
        height="21"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.9228 0.233398H0V14.3561H11.8715L17.9227 20.0574V14.3561H17.9228V0.233398Z"
          fill="black"
        />
      </mask>
      <g mask="url(#mask0_1847_1401)">
        <rect x="-7.58203" y="0.216797" width="51.0554" height="4.64853" fill="black" />
        <rect x="-7.58203" y="4.77051" width="51.0554" height="4.83827" fill="#E00003" />
        <rect x="-7.58203" y="9.60864" width="51.0554" height="15.9378" fill="#FECF02" />
      </g>
    </svg>
  );
}
