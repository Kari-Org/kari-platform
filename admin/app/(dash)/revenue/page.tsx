'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowDownToLine, Banknote, TrendingUp, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { adminApi } from '@/lib/admin-api';

const naira = (n: number | undefined) =>
  '₦' + Math.round(n ?? 0).toLocaleString('en-NG');

export default function RevenuePage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-finance'], queryFn: adminApi.financeSummary });

  return (
    <div>
      <PageHeader title="Revenue" subtitle="Platform commission, GMV and money flow" />

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Platform revenue" value={naira(data?.revenue)} icon={TrendingUp} loading={isLoading} accent />
        <StatCard label="GMV (all-time)" value={naira(data?.gmvAllTime)} icon={Banknote} loading={isLoading} />
        <StatCard label="GMV (today)" value={naira(data?.gmvToday)} icon={Banknote} loading={isLoading} />
        <StatCard label="Net float" value={naira((data?.topups ?? 0) - (data?.payouts ?? 0))} icon={Wallet} loading={isLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Money in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Wallet top-ups" value={naira(data?.topups)} sub={`${data?.topupCount ?? 0} transactions`} />
            <Row label="GMV (completed fares)" value={naira(data?.gmvAllTime)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Money out</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row
              label="Driver payouts"
              value={naira(data?.payouts)}
              sub={`${data?.payoutCount ?? 0} transactions`}
              icon={<ArrowDownToLine size={14} className="text-subtle" />}
            />
            <Row label="Commission retained" value={naira(data?.revenue)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-2 last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="text-sm text-white">{label}</p>
          {sub ? <p className="text-xs text-subtle">{sub}</p> : null}
        </div>
      </div>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}
