export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] w-full">
      <div>{children}</div>
    </div>
  );
}
