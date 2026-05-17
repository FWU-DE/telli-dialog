export type BadgeProps = {
  text: string;
};

export function Badge(props: BadgeProps) {
  return (
    <span className="border border-secondary bg-secondary rounded-full text-black text-xs font-semibold px-2">
      {props.text}
    </span>
  );
}
