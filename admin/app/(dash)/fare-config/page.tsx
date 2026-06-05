'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/admin-api';

const naira = (n: number) => '₦' + n.toLocaleString('en-NG');

export default function FareConfigPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-fare-config'], queryFn: adminApi.fareConfig });

  return (
    <div>
      <PageHeader title="Fare Configuration" subtitle="Current pricing & commission (read-only)" />

      <div className="mb-4 rounded-card border border-dashed border-hairline px-4 py-3 text-xs text-subtle">
        These values are sourced from the backend environment config. Runtime editing arrives with the
        config-store (v2); change them via deployment env vars for now.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ride pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Base fare" value={isLoading ? '—' : naira(data!.pricing.baseFare)} />
            <Row label="Per kilometre" value={isLoading ? '—' : naira(data!.pricing.perKm)} />
            <Row label="Per minute" value={isLoading ? '—' : naira(data!.pricing.perMin)} />
            <Row label="Fuel index" value={isLoading ? '—' : `${data!.pricing.fuelIndex}×`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Platform commission" value={isLoading ? '—' : `${data!.commission.commissionPct}%`} />
            <Row label="Rate (bps)" value={isLoading ? '—' : `${data!.commission.commissionRateBps}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cancellation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Rider cancellation fee" value={isLoading ? '—' : naira(data!.cancellation.cancellationFee)} />
            <Row label="Free-cancel grace" value={isLoading ? '—' : `${data!.cancellation.cancellationGraceSeconds}s`} />
            <Row label="Driver share of penalty" value={isLoading ? '—' : `${data!.cancellation.penaltyDriverShareBps / 100}%`} />
            <Row label="Driver cancel fee" value={isLoading ? '—' : naira(data!.cancellation.driverCancelFee)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Minimum top-up" value={isLoading ? '—' : naira(data!.wallet.minTopup)} />
            <Row label="Minimum payout" value={isLoading ? '—' : naira(data!.wallet.minPayout)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
