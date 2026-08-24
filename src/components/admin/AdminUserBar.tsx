'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface AdminUserBarProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  title: string;
}

export default function AdminUserBar({ supabaseUrl, supabaseAnonKey, title }: AdminUserBarProps) {
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
    await supabase.auth.signOut();
    router.replace(`/${locale}/admin/login`);
    router.refresh();
  };

  return (
    <div className="border-b border-ajin-border bg-white">
      <div className="container-ajin flex h-14 items-center justify-between px-4">
        <Link href="/admin/inmuebles" className="text-sm font-semibold text-ajin-primary">
          {title}
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-ajin-gray-300 transition-colors hover:text-ajin-primary"
        >
          <LogOut size={16} /> {t('signOut')}
        </button>
      </div>
    </div>
  );
}
