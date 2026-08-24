'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const tAdmin = useTranslations('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.replace(`/${locale}/admin/inmuebles`);
      router.refresh();
    } catch {
      setError('Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-padding">
      <div className="container-ajin max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-ajin-primary">{tAdmin('loginTitle')}</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ajin-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-ajin-text">
              {tAdmin('password')}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '...' : tAdmin('signIn')}
          </Button>
        </form>
      </div>
    </section>
  );
}
