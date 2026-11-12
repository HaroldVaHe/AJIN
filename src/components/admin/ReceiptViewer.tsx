'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface ViewerReceipt {
  id: number;
  url: string;
  title: string;
  meta: string;
}

interface ReceiptViewerProps {
  receipts: ViewerReceipt[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export default function ReceiptViewer({
  receipts,
  index,
  onIndexChange,
  onClose,
}: ReceiptViewerProps) {
  const t = useTranslations('admin.leases.manager.viewer');
  const total = receipts.length;
  const current = receipts[index];

  const prev = () => onIndexChange((index - 1 + total) % total);
  const next = () => onIndexChange((index + 1) % total);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && total > 1) onIndexChange((index - 1 + total) % total);
      if (event.key === 'ArrowRight' && total > 1) onIndexChange((index + 1) % total);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [index, total, onIndexChange, onClose]);

  if (!current) return null;

  const btn =
    'absolute top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/30';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate font-semibold">{current.title}</p>
          <p className="truncate text-xs text-white/70">
            {current.meta} · {index + 1} / {total}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/30"
          >
            {t('openOriginal')}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 p-2 hover:bg-white/30"
            aria-label={t('close')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-14 pb-6">
        {total > 1 && (
          <button type="button" onClick={prev} className={`${btn} left-3`} aria-label={t('previous')}>
            <ChevronLeft size={22} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={current.url}
          alt={current.title}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
        {total > 1 && (
          <button type="button" onClick={next} className={`${btn} right-3`} aria-label={t('next')}>
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
