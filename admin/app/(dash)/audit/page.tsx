'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/shell/page-header';
import { Badge } from '@/components/ui/badge';
import { type Column, DataTable } from '@/components/ui/data-table';
import { type AuditEntry, adminApi } from '@/lib/admin-api';
import { cn } from '@/lib/utils';

const ACTIONS = ['', 'user.status', 'driver.verify', 'trip.cancel', 'ticket.update', 'driver.dedicated.create'];

export default function AuditPage() {
  const [action, setAction] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', action],
    queryFn: () => adminApi.audit({ action: action || undefined, limit: 100 }),
  });

  const columns: Column<AuditEntry>[] = [
    { key: 'when', header: 'When', render: (a) => new Date(a.createdAt).toLocaleString() },
    { key: 'actor', header: 'Admin', render: (a) => a.actorEmail ?? a.actorId?.slice(0, 8) ?? '—' },
    { key: 'role', header: 'Role', render: (a) => (a.actorRole ? <Badge tone="brand">{a.actorRole}</Badge> : '—') },
    { key: 'action', header: 'Action', render: (a) => <span className="font-mono text-xs text-white">{a.action}</span> },
    { key: 'target', header: 'Target', render: (a) => (a.targetId ? a.targetId.slice(0, 8) : '—') },
    {
      key: 'meta',
      header: 'Details',
      render: (a) =>
        a.meta ? <span className="font-mono text-xs text-subtle">{JSON.stringify(a.meta)}</span> : '—',
    },
  ];

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every admin write action, append-only" />
      <div className="mb-4 flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a || 'all'}
            type="button"
            onClick={() => setAction(a)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              action === a ? 'border-brand bg-brand/10 text-brand' : 'border-hairline text-muted hover:text-white',
            )}
          >
            {a || 'All'}
          </button>
        ))}
      </div>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} empty="No audit entries yet" />
    </div>
  );
}
