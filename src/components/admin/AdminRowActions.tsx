'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Pencil, Trash2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { PropertyStatus } from '@/types/property';

interface AdminRowActionsProps {
  propertyId: number;
  status: PropertyStatus;
  deleteConfirm: string;
}

export default function AdminRowActions({
  propertyId,
  status,
  deleteConfirm,
}: AdminRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const setStatus = async (newStatus: PropertyStatus) => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/inmuebles/${propertyId}/estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (busy || !confirm(deleteConfirm)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/inmuebles/${propertyId}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const btn =
    'rounded-lg border border-ajin-border p-2 text-ajin-gray-300 transition-colors disabled:opacity-40';

  return (
    <div className="flex justify-end gap-2">
      {status === 'pending' && (
        <>
          <button
            onClick={() => void setStatus('approved')}
            disabled={busy}
            className={`${btn} hover:border-green-500 hover:text-green-600`}
            title="Aprobar"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => void setStatus('rejected')}
            disabled={busy}
            className={`${btn} hover:border-orange-400 hover:text-orange-500`}
            title="Rechazar"
          >
            <X size={14} />
          </button>
        </>
      )}
      {status === 'rejected' && (
        <button
          onClick={() => void setStatus('approved')}
          disabled={busy}
          className={`${btn} hover:border-green-500 hover:text-green-600`}
          title="Aprobar"
        >
          <Check size={14} />
        </button>
      )}
      {status === 'approved' && (
        <button
          onClick={() => void setStatus('pending')}
          disabled={busy}
          className={`${btn} hover:border-orange-400 hover:text-orange-500`}
          title="Despublicar"
        >
          <X size={14} />
        </button>
      )}
      <Link
        href={`/admin/inmuebles/${propertyId}`}
        className={`${btn} hover:border-ajin-accent hover:text-ajin-accent`}
        title="Editar"
      >
        <Pencil size={14} />
      </Link>
      <button
        onClick={() => void handleDelete()}
        disabled={busy}
        className={`${btn} hover:border-red-400 hover:text-red-500`}
        title="Eliminar"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
