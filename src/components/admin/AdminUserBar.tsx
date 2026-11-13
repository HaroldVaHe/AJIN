'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Brain, Building2, KeyRound, LogOut, ScrollText, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Permission, Role } from '@/lib/permission-catalog';

interface AdminUserBarProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  title: string;
  role: Role;
  permissions: Permission[];
}

export default function AdminUserBar({
  supabaseUrl,
  supabaseAnonKey,
  title,
  role,
  permissions,
}: AdminUserBarProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin');

  useEffect(() => {
    const supabase = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace(`/${locale}/admin/login`);
    });
  }, [router, locale, supabaseUrl, supabaseAnonKey]);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
    await fetch('/api/admin/login-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logout: true }),
    }).catch(() => {});
    await supabase.auth.signOut();
    router.replace(`/${locale}/admin/login`);
    router.refresh();
  };

  const linkClass =
    'flex items-center gap-1.5 text-sm text-ajin-gray-300 transition-colors hover:text-ajin-primary';

  return (
    <div className="border-b border-ajin-border bg-white">
      <div className="container-ajin flex h-14 items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/admin" className="truncate text-sm font-semibold text-ajin-primary">
            {title}
          </Link>
          <span className="hidden rounded-full bg-ajin-surface px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ajin-gray-400 sm:inline">
            {t(`roles.${role}`)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {permissions.includes('properties.manage') && (
            <Link href="/admin/inmuebles" className={linkClass}>
              <Building2 size={16} /> <span className="hidden sm:inline">{t('nav.properties')}</span>
            </Link>
          )}
          {permissions.includes('leases.manage') && (
            <Link href="/admin/arriendos" className={linkClass}>
              <KeyRound size={16} /> <span className="hidden sm:inline">{t('nav.leases')}</span>
            </Link>
          )}
          {permissions.includes('knowledge.view') && (
            <Link href="/admin/cerebro" className={linkClass}>
              <Brain size={16} /> <span className="hidden sm:inline">{t('nav.cerebro')}</span>
            </Link>
          )}
          {permissions.includes('roles.manage') && (
            <Link href="/admin/roles" className={linkClass}>
              <ShieldCheck size={16} /> <span className="hidden sm:inline">{t('nav.roles')}</span>
            </Link>
          )}
          {permissions.includes('audit.view') && (
            <Link href="/admin/auditoria" className={linkClass}>
              <ScrollText size={16} /> <span className="hidden sm:inline">{t('auditLink')}</span>
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-ajin-gray-300 transition-colors hover:text-ajin-primary"
            aria-label={t('signOut')}
          >
            <LogOut size={16} /> <span className="hidden sm:inline">{t('signOut')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
