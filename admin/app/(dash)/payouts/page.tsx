'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shell/page-header';
import { Badge, type Tone } from '@/components/ui/badge';
import { type Column, DataTable } from '@/components/ui/data-table';
import { type Payout, adminApi } from '@/lib/admin-api';

const naira = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');
const STATUS_TONE: Record<string, Tone> = {
  SUCCESS: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
};

export default function PayoutsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: () => adminApi.payouts({ limit: 50 }),
  });

  const columns: Column<Payout>[] = [
    { key: 'reference', header: 'Reference', render: (p) => <span className="font-mono text-xs">{p.reference}</span> },
    { key: 'amount', header: 'Amount', render: (p) => naira(p.amount) },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge tone={STATUS_TONE[p.status] ?? 'default'}>{p.status}</Badge>,
    },
    { key: 'provider', header: 'Provider', render: (p) => p.provider ?? '—' },
    { key: 'driver', header: 'Driver', render: (p) => (p.userId ? p.userId.slice(0, 8) : '—') },
    { key: 'date', header: 'Date', render: (p) => new Date(p.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader title="Driver Payouts" subtitle={`${data?.total ?? 0} payout transactions`} />
      <DataTable columns={columns} rows={data?.items} loading={isLoading} empty="No payouts yet" />
    </div>
  );
}
