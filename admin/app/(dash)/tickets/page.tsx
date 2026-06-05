'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useCan } from '@/components/can';
import { PageHeader } from '@/components/shell/page-header';
import { Badge, type Tone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Column, DataTable } from '@/components/ui/data-table';
import { type Ticket, type TicketStatus, adminApi } from '@/lib/admin-api';
import { cn } from '@/lib/utils';

const STATUS_TONE: Record<string, Tone> = {
  OPEN: 'warning',
  IN_PROGRESS: 'brand',
  RESOLVED: 'success',
  CLOSED: 'default',
};
const FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function TicketsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const canManage = useCan('tickets:manage');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tickets', status],
    queryFn: () => adminApi.tickets({ status: status || undefined, limit: 50 }),
  });

  const mut = useMutation({
    mutationFn: (body: { status?: TicketStatus; reply?: string }) => adminApi.updateTicket(selected!.id, body),
    onSuccess: (updated) => {
      setSelected(updated);
      setReply('');
      void qc.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });

  const columns: Column<Ticket>[] = [
    { key: 'subject', header: 'Subject', render: (t) => <span className="text-white">{t.subject}</span> },
    { key: 'from', header: 'From', render: (t) => t.requesterRole },
    { key: 'category', header: 'Category', render: (t) => t.category },
    { key: 'status', header: 'Status', render: (t) => <Badge tone={STATUS_TONE[t.status] ?? 'default'}>{t.status.replace(/_/g, ' ')}</Badge> },
    { key: 'created', header: 'Opened', render: (t) => new Date(t.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader title="Tickets" subtitle={`${data?.total ?? 0} support tickets`} />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              status === f.value ? 'border-brand bg-brand/10 text-brand' : 'border-hairline text-muted hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DataTable columns={columns} rows={data?.items} loading={isLoading} empty="No tickets" onRowClick={setSelected} />
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle>{selected.subject}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[selected.status] ?? 'default'}>{selected.status.replace(/_/g, ' ')}</Badge>
                  <span className="text-xs text-subtle">
                    {selected.requesterRole} · {selected.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="whitespace-pre-wrap rounded-md bg-surface p-3 text-sm text-white">{selected.message}</p>
                {selected.adminReply ? (
                  <div className="rounded-md border border-hairline p-3 text-sm">
                    <p className="mb-1 text-xs text-subtle">Admin reply</p>
                    <p className="whitespace-pre-wrap text-white">{selected.adminReply}</p>
                  </div>
                ) : null}

                {canManage ? (
                  <>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply…"
                      rows={3}
                      className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-white outline-none placeholder:text-subtle focus:border-brand"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={mut.isPending || !reply.trim()} onClick={() => mut.mutate({ reply: reply.trim() })}>
                        Send reply
                      </Button>
                      <Button size="sm" variant="outline" disabled={mut.isPending} onClick={() => mut.mutate({ status: 'RESOLVED' })}>
                        Resolve
                      </Button>
                      <Button size="sm" variant="ghost" disabled={mut.isPending} onClick={() => mut.mutate({ status: 'CLOSED' })}>
                        Close
                      </Button>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-subtle">Select a ticket to view + respond.</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
