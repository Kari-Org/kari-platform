'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useCan } from '@/components/can';
import { PageHeader } from '@/components/shell/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type AdminDriverRow, type CreateDedicatedDriverBody, adminApi } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { type Column, DataTable } from '@/components/ui/data-table';

const EMPTY: CreateDedicatedDriverBody = {
  email: '',
  phone: '',
  password: '',
  firstName: '',
  lastName: '',
  vehicleModel: '',
  plateNumber: '',
  category: 'COMFORT',
};

export default function DedicatedDriversPage() {
  const qc = useQueryClient();
  const canOnboard = useCan('dedicated:onboard');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateDedicatedDriverBody>(EMPTY);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['admin-drivers'], queryFn: adminApi.drivers });
  const dedicated = (data ?? []).filter((d) => d.driverType === 'DEDICATED');

  const mut = useMutation({
    mutationFn: () => adminApi.createDedicated(form),
    onSuccess: () => {
      setForm(EMPTY);
      setOpen(false);
      setError('');
      void qc.invalidateQueries({ queryKey: ['admin-drivers'] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not create driver'),
  });

  const set = (k: keyof CreateDedicatedDriverBody) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const columns: Column<AdminDriverRow>[] = [
    { key: 'name', header: 'Name', render: (d) => [d.firstName, d.lastName].filter(Boolean).join(' ') || '—' },
    { key: 'vehicle', header: 'Vehicle', render: (d) => (d.vehicle ? `${d.vehicle.model} · ${d.vehicle.plateNumber}` : '—') },
    { key: 'class', header: 'Class', render: (d) => d.vehicle?.category ?? '—' },
    { key: 'avail', header: 'Status', render: (d) => <Badge tone={d.availability === 'OFFLINE' ? 'default' : 'success'}>{d.availability}</Badge> },
    { key: 'rating', header: 'Rating', render: (d) => (d.ratingCount > 0 ? `★ ${d.ratingAvg.toFixed(1)}` : '—') },
  ];

  return (
    <div>
      <div className="flex items-start justify-between">
        <PageHeader title="Dedicated Drivers" subtitle={`${dedicated.length} salaried drivers`} />
        {canOnboard && (
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            <Plus size={15} /> Onboard
          </Button>
        )}
      </div>

      {open && canOnboard && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Onboard a dedicated driver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="First name" value={form.firstName} onChange={set('firstName')} />
              <Input placeholder="Last name" value={form.lastName} onChange={set('lastName')} />
              <Input placeholder="Email" value={form.email} onChange={set('email')} />
              <Input placeholder="Phone (+234…)" value={form.phone} onChange={set('phone')} />
              <Input placeholder="Temp password" value={form.password} onChange={set('password')} />
              <Input placeholder="Vehicle model" value={form.vehicleModel} onChange={set('vehicleModel')} />
              <Input placeholder="Plate number" value={form.plateNumber} onChange={set('plateNumber')} />
            </div>
            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <Button size="sm" disabled={mut.isPending} onClick={() => mut.mutate()}>
                {mut.isPending ? 'Creating…' : 'Create driver'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns} rows={dedicated} loading={isLoading} empty="No dedicated drivers yet" />
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
