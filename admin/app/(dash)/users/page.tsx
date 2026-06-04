'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/shell/page-header';
import { Badge, type Tone } from '@/components/ui/badge';
import { type Column, DataTable } from '@/components/ui/data-table';
import { type AdminUserRow, adminApi } from '@/lib/admin-api';
import { cn } from '@/lib/utils';

const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: 'success',
  PENDING_VERIFICATION: 'warning',
  SUSPENDED: 'danger',
};

export default function UsersPage() {
  const [role, setRole] = useState<'RIDER' | 'DRIVER'>('RIDER');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', role, search],
    queryFn: () => adminApi.users({ role, search: search || undefined, limit: 50 }),
  });

  const columns: Column<AdminUserRow>[] = [
    { key: 'name', header: 'Name', render: (u) => u.profile?.name ?? '—' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'rating',
      header: 'Rating',
      render: (u) =>
        u.profile && u.profile.ratingCount > 0
          ? `★ ${u.profile.ratingAvg.toFixed(1)} (${u.profile.ratingCount})`
          : '—',
    },
    ...(role === 'DRIVER'
      ? [
          {
            key: 'onboarded',
            header: 'Onboarded',
            render: (u: AdminUserRow) =>
              u.profile?.onboardingComplete ? (
                <Badge tone="success">Yes</Badge>
              ) : (
                <Badge tone="warning">No</Badge>
              ),
          } as Column<AdminUserRow>,
        ]
      : []),
    {
      key: 'status',
      header: 'Status',
      render: (u) => <Badge tone={STATUS_TONE[u.status] ?? 'default'}>{u.status.replace(/_/g, ' ')}</Badge>,
    },
    { key: 'joined', header: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle={`${data?.total ?? 0} ${role.toLowerCase()}s`} />
      <div className="mb-4 flex items-center gap-3">
        <div className="flex rounded-md border border-hairline p-0.5">
          {(['RIDER', 'DRIVER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'rounded px-3 py-1.5 text-sm',
                role === r ? 'bg-card text-brand' : 'text-muted hover:text-white',
              )}
            >
              {r === 'RIDER' ? 'Riders' : 'Drivers'}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email or phone…"
          className="flex-1 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-white outline-none placeholder:text-subtle focus:border-brand"
        />
      </div>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} empty="No users found" />
    </div>
  );
}
