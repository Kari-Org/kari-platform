'use client';

import { createContext, useContext } from 'react';
import type { AdminUser } from '@/lib/auth';

const SessionContext = createContext<AdminUser | null>(null);

export function SessionProvider({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSession(): AdminUser {
  const user = useContext(SessionContext);
  if (!user) throw new Error('useSession must be used within <SessionProvider>');
  return user;
}
