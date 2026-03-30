export function CustomChatFieldInfo({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-1 text-base">
      <div className="font-semibold">{label}</div>
      <div className="font-normal">{value ?? '-'}</div>
    </div>
  );
}
