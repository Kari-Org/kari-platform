import { SessionProvider } from '@/components/session-provider';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { requireSession } from '@/lib/auth';
import { QueryProvider } from '@/lib/query';

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  return (
    <SessionProvider user={user}>
      <QueryProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </QueryProvider>
    </SessionProvider>
  );
}
