'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { hasPermission } from '@kari/types';
import { KariMark } from '@/components/KariMark';
import { useSession } from '@/components/session-provider';
import { NAV } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const user = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-hairline bg-surface transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <KariMark size={32} className="shrink-0 text-brand" />
        {!collapsed && <span className="font-semibold text-white">Kari Admin</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {NAV.map((group) => {
          const items = group.items.filter((i) => hasPermission(user.adminRole, i.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.title} className="mb-4">
              {!collapsed && (
                <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-subtle">
                  {group.title}
                </p>
              )}
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      'mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      active ? 'bg-card text-brand' : 'text-muted hover:bg-card hover:text-white',
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex h-10 items-center justify-center border-t border-hairline text-subtle hover:text-white"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        <ChevronLeft size={18} className={cn('transition-transform', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}
