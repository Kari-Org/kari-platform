'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/session-provider';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const user = useSession();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-6">
      <span className="rounded bg-card px-2 py-1 text-[11px] font-medium text-subtle">
        {process.env.NEXT_PUBLIC_ENV ?? 'DEV'}
      </span>
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm text-white">{user.email}</p>
          <p className="text-[11px] text-brand">{user.adminRole}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
