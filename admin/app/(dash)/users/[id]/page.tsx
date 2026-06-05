'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCan } from '@/components/can';
import { PageHeader } from '@/components/shell/page-header';
import { Badge, type Tone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type AdminRide, adminApi } from '@/lib/admin-api';

const naira = (n: number | null) => (n == null ? '—' : '₦' + Math.round(n).toLocaleString('en-NG'));
const ACTIVE = ['SEARCHING', 'OFFERED', 'NEGOTIATING', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'];
const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: 'success',
  PENDING_VERIFICATION: 'warning',
  SUSPENDED: 'danger',
  DEACTIVATED: 'default',
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-user', id], queryFn: () => adminApi.user(id) });

  const canManageUser = useCan('riders:manage');
  const canVerify = useCan('drivers:verify');
  const canOverride = useCan('trips:override');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-user', id] });
  const statusMut = useMutation({
    mutationFn: (status: string) => adminApi.setUserStatus(id, status),
    onSuccess: invalidate,
  });
  const verifyMut = useMutation({
    mutationFn: (approve: boolean) => adminApi.verifyDriver(id, approve),
    onSuccess: invalidate,
  });
  const cancelMut = useMutation({
    mutationFn: (rideId: string) => adminApi.cancelRide(rideId, 'Cancelled by admin'),
    onSuccess: invalidate,
  });

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="User" />
        <p className="text-sm text-subtle">Loading…</p>
      </div>
    );
  }

  const { user, profile, rides } = data;
  const isDriver = user.role === 'DRIVER';
  const p = (profile ?? {}) as Record<string, unknown>;
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || '—';
  const busy = statusMut.isPending || verifyMut.isPending;

  return (
    <div>
      <Link href="/users" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-white">
        <ArrowLeft size={15} /> Users
      </Link>
      <PageHeader title={name === '—' ? user.email : name} subtitle={`${user.role} · ${user.email}`} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="Status" value={<Badge tone={STATUS_TONE[user.status] ?? 'default'}>{user.status.replace(/_/g, ' ')}</Badge>} />
            <Field label="Phone" value={user.phone} />
            <Field label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
            {isDriver ? (
              <>
                <Field label="NIN status" value={String(p.ninStatus ?? '—')} />
                <Field label="Liveness" value={p.livenessVerified ? 'Verified' : 'Pending'} />
                <Field label="Onboarding" value={p.onboardingComplete ? 'Complete' : 'Incomplete'} />
              </>
            ) : null}

            {/* Actions */}
            <div className="space-y-2 pt-3">
              {canManageUser &&
                (user.status === 'SUSPENDED' ? (
                  <Button size="sm" className="w-full" disabled={busy} onClick={() => statusMut.mutate('ACTIVE')}>
                    Reactivate account
                  </Button>
                ) : (
                  <Button size="sm" variant="danger" className="w-full" disabled={busy} onClick={() => statusMut.mutate('SUSPENDED')}>
                    Suspend account
                  </Button>
                ))}
              {isDriver && canVerify && (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" disabled={busy} onClick={() => verifyMut.mutate(true)}>
                    Approve KYC
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" disabled={busy} onClick={() => verifyMut.mutate(false)}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent rides</CardTitle>
          </CardHeader>
          <CardContent>
            {rides.length === 0 ? (
              <p className="text-sm text-subtle">No rides yet.</p>
            ) : (
              <div className="divide-y divide-hairline">
                {rides.map((r: AdminRide) => {
                  const active = ACTIVE.includes(r.status);
                  return (
                    <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-white">
                          {r.pickupAddress ?? 'Pickup'} → {r.dropoffAddress ?? 'Destination'}
                        </p>
                        <p className="text-xs text-subtle">
                          {new Date(r.createdAt).toLocaleString()} · {naira(r.agreedPrice ?? r.quotedPrice)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone={active ? 'brand' : 'default'}>{r.status.replace(/_/g, ' ')}</Badge>
                        {active && canOverride && (
                          <Button size="sm" variant="danger" disabled={cancelMut.isPending} onClick={() => cancelMut.mutate(r.id)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
