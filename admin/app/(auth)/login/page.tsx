'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@kari.test');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? 'Login failed');
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const input =
    'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-white outline-none placeholder:text-subtle focus:border-brand';

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kari-logo.png" alt="Kari" className="mx-auto mb-3 h-16 w-16 object-contain" />
          <h1 className="text-xl font-semibold text-white">Kari Admin</h1>
          <p className="mt-1 text-sm text-subtle">Sign in to the operations console</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="username"
            placeholder="Email"
            className={input}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            className={input}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-subtle">
          <div className="h-px flex-1 bg-hairline" />
          OR
          <div className="h-px flex-1 bg-hairline" />
        </div>

        {/* Zoho SSO — stubbed; flip ADMIN_SSO=zoho with tenant creds to enable. */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            setError('Zoho SSO is stubbed for now — use email sign-in. (Wire ADMIN_SSO=zoho to enable.)')
          }
        >
          Sign in with Zoho (SSO)
        </Button>
      </div>
    </main>
  );
}
