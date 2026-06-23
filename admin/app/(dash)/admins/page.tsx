'use client';

import { AdminRole, UserStatus } from '@kari/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useCan } from '@/components/can';
import { useSession } from '@/components/session-provider';
import { PageHeader } from '@/components/shell/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Column, DataTable } from '@/components/ui/data-table';
import { ApiError } from '@/lib/api';
import { type AdminAccount, type CreateAdminBody, adminApi } from '@/lib/admin-api';
import { cn } from '@/lib/utils';

const ROLES = Object.values(AdminRole);

const EMPTY: CreateAdminBody = { email: '', phone: '', password: '', adminRole: AdminRole.OPS };

/** A throwaway initial password; the creator shares it out-of-band (no email flow). */
function genPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 14; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${s}!9`;
}

export default function AdminsPage() {
  const qc = useQueryClient();
  const me = useSession();
  const canManage = useCan('admins:manage');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateAdminBody>(EMPTY);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['admin-admins'], queryFn: adminApi.admins });
  const admins = data ?? [];

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['admin-admins'] });
  const onError = (e: unknown) =>
    setError(e instanceof ApiError ? e.message : 'Something went wrong');

  const create = useMutation({
    mutationFn: () => adminApi.createAdmin(form),
    onSuccess: () => {
      setForm(EMPTY);
      setOpen(false);
      setError('');
      invalidate();
    },
    onError,
  });

  const role = useMutation({
    mutationFn: (v: { id: string; adminRole: AdminRole }) => adminApi.setAdminRole(v.id, v.adminRole),
    onSuccess: () => {
      setError('');
      invalidate();
    },
    onError,
  });

  const status = useMutation({
    mutationFn: (v: { id: string; status: string }) => adminApi.setAdminStatus(v.id, v.status),
    onSuccess: () => {
      setError('');
      invalidate();
    },
    onError,
  });

  const busy = create.isPending || role.isPending || status.isPending;

  const set =
    (k: keyof CreateAdminBody) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const columns: Column<AdminAccount>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (a) => (
        <span className="text-white">
          {a.email}
          {a.id === me.id ? <span className="ml-2 text-xs text-subtle">(you)</span> : null}
        </span>
      ),
    },
    { key: 'phone', header: 'Phone', render: (a) => a.phone },
    {
      key: 'role',
      header: 'Role',
      render: (a) =>
        canManage && a.id !== me.id ? (
          <Select
            value={a.adminRole ?? ''}
            disabled={busy}
            onChange={(e) => role.mutate({ id: a.id, adminRole: e.target.value as AdminRole })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        ) : (
          <span className="text-muted">{a.adminRole ?? '—'}</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <Badge tone={a.status === 'ACTIVE' ? 'success' : 'danger'}>{a.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) =>
        canManage && a.id !== me.id ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              status.mutate({
                id: a.id,
                status: a.status === 'ACTIVE' ? UserStatus.SUSPENDED : UserStatus.ACTIVE,
              })
            }
          >
            {a.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-start justify-between">
        <PageHeader
          title="Admins & Roles"
          subtitle={`${admins.length} admin ${admins.length === 1 ? 'account' : 'accounts'}`}
        />
        {canManage && (
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            <Plus size={15} /> Invite admin
          </Button>
        )}
      </div>

      {open && canManage && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Create an admin account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Email" type="email" value={form.email} onChange={set('email')} />
              <Input placeholder="Phone (+234…)" value={form.phone} onChange={set('phone')} />
              <div className="flex gap-2">
                <Input
                  placeholder="Initial password"
                  className="flex-1"
                  value={form.password}
                  onChange={set('password')}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setForm((f) => ({ ...f, password: genPassword() }))}
                >
                  <RefreshCw size={14} /> Generate
                </Button>
              </div>
              <Select value={form.adminRole} onChange={set('adminRole')}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
            <p className="mt-3 text-xs text-subtle">
              No email is sent — share these credentials securely. The new admin can sign in
              immediately.
            </p>
            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <Button size="sm" disabled={create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? 'Creating…' : 'Create admin'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && !open ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

      <DataTable columns={columns} rows={admins} loading={isLoading} empty="No admins yet" />
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-white outline-none placeholder:text-subtle focus:border-brand',
        className,
      )}
    />
  );
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand',
        className,
      )}
    >
      {children}
    </select>
  );
}
