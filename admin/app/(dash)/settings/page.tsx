'use client';

import { AdminRole, PERMISSIONS, hasPermission } from '@kari/types';
import { Check, Minus } from 'lucide-react';
import { useSession } from '@/components/session-provider';
import { PageHeader } from '@/components/shell/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ROLES = Object.values(AdminRole);

export default function SettingsPage() {
  const me = useSession();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your session and the RBAC permission matrix" />

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Signed in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Email</span>
            <span className="text-white">{me.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Admin role</span>
            <Badge tone="brand">{me.adminRole ?? '—'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role → permission matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-subtle">
                  <th className="px-3 py-2 font-medium">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-3 py-2 text-center text-xs font-medium">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm) => (
                  <tr key={perm} className="border-b border-hairline last:border-0">
                    <td className="px-3 py-2 font-mono text-xs text-white">{perm}</td>
                    {ROLES.map((r) => (
                      <td key={r} className="px-3 py-2 text-center">
                        {hasPermission(r, perm) ? (
                          <Check size={14} className="mx-auto text-success" />
                        ) : (
                          <Minus size={14} className="mx-auto text-subtle" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-subtle">
            Roles are defined in code (`@kari/types` · ROLE_PERMISSIONS) — the single source of truth shared
            by this console and the backend guard. Admin invitations &amp; role assignment land in a later pass.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
