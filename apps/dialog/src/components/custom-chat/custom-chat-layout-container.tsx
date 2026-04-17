export function CustomChatLayoutContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="data-custom-chat-layout relative flex flex-col gap-6 pb-8">{children}</div>
  );
}
