'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminGuardedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin');

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace(`/${locale}/admin/login`);
    });
  }, [router, locale]);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace(`/${locale}/admin/login`);
    router.refresh();
  };

  return (
    <div className="min-h-[70vh]">
      <div className="border-b border-ajin-border bg-white">
        <div className="container-ajin flex h-14 items-center justify-between px-4">
          <Link href="/admin/inmuebles" className="text-sm font-semibold text-ajin-primary">
            {t('listTitle')}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-ajin-gray-300 transition-colors hover:text-ajin-primary"
          >
            <LogOut size={16} /> {t('signOut')}
          </button>
        </div>
      </div>
      <div className="section-padding">
        <div className="container-ajin">{children}</div>
      </div>
    </div>
  );
}
