'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/shell/page-header';
import { Badge, type Tone } from '@/components/ui/badge';
import { type Column, DataTable } from '@/components/ui/data-table';
import { type AdminRide, adminApi } from '@/lib/admin-api';
import { naira } from '@/lib/utils';

const STATUSES = [
  '',
  'SEARCHING',
  'OFFERED',
  'NEGOTIATING',
  'ACCEPTED',
  'DRIVER_ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

const STATUS_TONE: Record<string, Tone> = {
  COMPLETED: 'success',
  CANCELLED: 'danger',
  IN_PROGRESS: 'brand',
  DRIVER_ARRIVED: 'brand',
  ACCEPTED: 'brand',
};

export default function TripsPage() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-rides', status],
    queryFn: () => adminApi.rides({ status: status || undefined, limit: 50 }),
  });

  const columns: Column<AdminRide>[] = [
    {
      key: 'route',
      header: 'Route',
      render: (r) => (
        <span className="block max-w-xs truncate">
          {r.pickupAddress ?? '—'} → {r.dropoffAddress ?? '—'}
        </span>
      ),
    },
    { key: 'cat', header: 'Class', render: (r) => r.carCategory },
    { key: 'fare', header: 'Fare', render: (r) => naira(r.agreedPrice ?? r.quotedPrice) },
    { key: 'type', header: 'Type', render: (r) => r.priceType },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={STATUS_TONE[r.status] ?? 'default'}>{r.status.replace(/_/g, ' ')}</Badge>,
    },
    { key: 'when', header: 'When', render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader title="Trips" subtitle={`${data?.total ?? 0} total`} />
      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === '' ? 'All statuses' : s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} empty="No trips" />
    </div>
  );
}
