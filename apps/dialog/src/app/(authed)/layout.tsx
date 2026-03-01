import SessionWatcher from '@/auth/SessionWatcher';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionWatcher redirectTo="/api/auth/logout-callback">
      <div className="h-dvh w-full">
        <div>{children}</div>
      </div>
    </SessionWatcher>
  );
}
