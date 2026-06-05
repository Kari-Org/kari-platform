'use client';

import { useQuery } from '@tanstack/react-query';
import { Car, Radio, Wifi } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Badge, type Tone } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { type Column, DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { type FleetDriver, adminApi } from '@/lib/admin-api';

// Rough Lagos bounding box for the relative scatter plot.
const BOUNDS = { latMin: 6.35, latMax: 6.75, lngMin: 3.05, lngMax: 3.75 };
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const AVAIL_TONE: Record<string, Tone> = { ONLINE: 'success', ON_TRIP: 'brand', OFFLINE: 'default' };

type Row = FleetDriver & { id: string };

export default function LiveRidesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-fleet'],
    queryFn: adminApi.fleet,
    refetchInterval: 5000,
  });

  const rows: Row[] = (data?.drivers ?? []).map((d) => ({ ...d, id: d.driverId }));

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Driver' },
    {
      key: 'availability',
      header: 'Status',
      render: (d) => (
        <Badge tone={AVAIL_TONE[d.availability] ?? 'default'}>{d.availability.replace(/_/g, ' ')}</Badge>
      ),
    },
    { key: 'category', header: 'Class', render: (d) => d.category ?? '—' },
    {
      key: 'ride',
      header: 'Active ride',
      render: (d) =>
        d.rideId ? (
          <span className="text-xs text-muted">
            {d.rideStatus?.replace(/_/g, ' ')} · {d.rideId.slice(0, 8)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'pos',
      header: 'Position',
      render: (d) => (
        <span className="text-xs text-subtle">
          {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Live Rides" subtitle="Active fleet — refreshes every 5s" />

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Active drivers" value={data?.counts.total} icon={Radio} loading={isLoading} accent />
        <StatCard label="Online (idle)" value={data?.counts.online} icon={Wifi} loading={isLoading} />
        <StatCard label="On a trip" value={data?.counts.onTrip} icon={Car} loading={isLoading} />
      </div>

      {/* Relative position scatter (dependency-free; tiled basemap needs a Mapbox token — follow-up) */}
      <Card className="mb-5 p-4">
        <p className="mb-2 text-xs text-subtle">Greater Lagos · relative positions</p>
        <div className="relative w-full overflow-hidden rounded-md border border-hairline bg-surface" style={{ aspectRatio: '16 / 7' }}>
          {rows.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-subtle">
              {isLoading ? 'Loading fleet…' : 'No active drivers right now.'}
            </div>
          ) : (
            rows.map((d) => {
              const x = clamp01((d.lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin));
              const y = clamp01((BOUNDS.latMax - d.lat) / (BOUNDS.latMax - BOUNDS.latMin));
              const onTrip = d.availability === 'ON_TRIP';
              return (
                <div
                  key={d.id}
                  title={`${d.name} · ${d.availability}`}
                  className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-bg ${onTrip ? 'bg-brand' : 'bg-success'}`}
                  style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                />
              );
            })
          )}
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} loading={isLoading} empty="No active drivers" />
    </div>
  );
}
