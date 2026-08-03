'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useCan } from '@/components/can';
import { PageHeader } from '@/components/shell/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Column, DataTable } from '@/components/ui/data-table';
import { type ShuttleRouteRow, adminApi } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';

export default function ShuttlePage() {
  const qc = useQueryClient();
  const canAssign = useCan('shuttle:assign');
  const [assigning, setAssigning] = useState<ShuttleRouteRow | null>(null);
  const [driverId, setDriverId] = useState('');
  const [plate, setPlate] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const { data: routes, isLoading } = useQuery({ queryKey: ['admin-shuttle-routes'], queryFn: adminApi.shuttleRoutes });
  const { data: drivers } = useQuery({ queryKey: ['admin-drivers'], queryFn: adminApi.drivers, enabled: canAssign });
  const dedicated = (drivers ?? []).filter((d) => d.driverType === 'DEDICATED');

  const done = () => {
    setAssigning(null);
    setDriverId('');
    setPlate('');
    setLabel('');
    setError('');
    void qc.invalidateQueries({ queryKey: ['admin-shuttle-routes'] });
  };

  const assign = useMutation({
    mutationFn: () =>
      adminApi.setShuttleAssignment(assigning!.id, { driverId, busPlateNumber: plate, busLabel: label || undefined }),
    onSuccess: done,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not update the assignment'),
  });

  const clear = useMutation({
    mutationFn: (routeId: string) => adminApi.setShuttleAssignment(routeId, { driverId: null }),
    onSuccess: done,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not clear the assignment'),
  });

  const columns: Column<ShuttleRouteRow>[] = [
    { key: 'name', header: 'Route', render: (r) => r.name },
    { key: 'corridor', header: 'Corridor', render: (r) => r.corridor },
    {
      key: 'active',
      header: 'Active',
      render: (r) => <Badge tone={r.active ? 'success' : 'default'}>{r.active ? 'ACTIVE' : 'INACTIVE'}</Badge>,
    },
    {
      key: 'driver',
      header: 'Assigned driver',
      render: (r) => r.assignedDriverName ?? <span className="text-subtle">Unassigned</span>,
    },
    {
      key: 'bus',
      header: 'Bus',
      render: (r) =>
        r.busPlateNumber ? [r.busPlateNumber, r.busLabel].filter(Boolean).join(' · ') : '—',
    },
    { key: 'trips', header: 'Upcoming trips', render: (r) => r.upcomingTrips },
    ...(canAssign
      ? [
          {
            key: 'actions',
            header: '',
            render: (r: ShuttleRouteRow) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setAssigning(r); setError(''); }}>
                  {r.assignedDriverId ? 'Reassign' : 'Assign'}
                </Button>
                {r.assignedDriverId && (
                  <Button size="sm" variant="ghost" disabled={clear.isPending} onClick={() => clear.mutate(r.id)}>
                    Clear
                  </Button>
                )}
              </div>
            ),
          } as Column<ShuttleRouteRow>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader title="Shuttle" subtitle="Routes and their dedicated driver + bus assignments" />

      {assigning && canAssign && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>
              {assigning.assignedDriverId ? 'Reassign' : 'Assign'} — {assigning.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand"
              >
                <option value="">Select a dedicated driver…</option>
                {dedicated.map((d) => (
                  <option key={d.userId} value={d.userId}>
                    {[d.firstName, d.lastName].filter(Boolean).join(' ') || d.userId}
                  </option>
                ))}
              </select>
              <Input placeholder="Bus plate number" value={plate} onChange={(e) => setPlate(e.target.value)} />
              <Input placeholder="Bus label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <Button size="sm" disabled={assign.isPending || !driverId || !plate} onClick={() => assign.mutate()}>
                {assign.isPending ? 'Saving…' : 'Save assignment'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAssigning(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns} rows={routes ?? []} loading={isLoading} empty="No shuttle routes seeded" />
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-white outline-none placeholder:text-subtle focus:border-brand"
    />
  );
}
