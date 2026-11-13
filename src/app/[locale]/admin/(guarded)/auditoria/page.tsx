import { ScrollText, ShieldQuestion } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { deviceLabel } from '@/lib/audit';
import { redirect } from '@/i18n/navigation';
import { getSessionAuth, hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

interface AuditRow {
  id: number;
  actor_email: string;
  action: string;
  entity: string;
  entity_id: string;
  detail: Record<string, unknown>;
  ip: string;
  user_agent: string;
  created_at: string;
}

const ACTIONS = [
  'admin.login',
  'admin.login_failed',
  'admin.logout',
  'admin.unauthorized',
  'property.create',
  'property.update',
  'property.delete',
  'property.status',
  'photo.upload',
  'photo.delete',
  'photos.reorder',
  'photos.delete_all',
  'submission.create',
  'cron.cleanup',
  'lease.create',
  'lease.update',
  'lease.status',
  'lease.delete',
  'lease.periods_generate',
  'lease.period_update',
  'lease.receipt_upload',
  'lease.receipt_delete',
  'role.permissions',
  'role.assign',
  'role.remove',
  'cron.lease_reminders',
  'knowledge.ask',
  'knowledge.sync',
  'cron.knowledge_sync',
] as const;

type Locale = 'es' | 'en';

const FIELD_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    operation: 'Operación', type: 'Tipo', title: 'Título', description: 'Descripción',
    price_cop: 'Precio', area_m2: 'Área (m²)', bedrooms: 'Habitaciones', bathrooms: 'Baños',
    parking: 'Parqueaderos', stratum: 'Estrato', neighborhood: 'Barrio', city: 'Ciudad',
    department: 'Departamento', owner_name: 'Nombre del dueño', owner_phone: 'Teléfono',
    owner_email: 'Email', status: 'Estado', featured: 'Destacado',
  },
  en: {
    operation: 'Operation', type: 'Type', title: 'Title', description: 'Description',
    price_cop: 'Price', area_m2: 'Area (m²)', bedrooms: 'Bedrooms', bathrooms: 'Bathrooms',
    parking: 'Parking', stratum: 'Stratum', neighborhood: 'Neighborhood', city: 'City',
    department: 'Department', owner_name: 'Owner name', owner_phone: 'Phone',
    owner_email: 'Email', status: 'Status', featured: 'Featured',
  },
};

function fmtMoney(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-CO' : 'en-US', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n);
}

function valueLabel(locale: Locale, field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  const opLabels: Record<string, string> =
    locale === 'es' ? { venta: 'Venta', arriendo: 'Arriendo' } : { venta: 'Sale', arriendo: 'Rent' };
  const typeLabels: Record<string, string> =
    locale === 'es'
      ? { apartamento: 'Apartamento', casa: 'Casa', oficina: 'Oficina', lote: 'Lote', bodega: 'Bodega' }
      : { apartamento: 'Apartment', casa: 'House', oficina: 'Office', lote: 'Lot', bodega: 'Warehouse' };
  const statusLabels: Record<string, string> =
    locale === 'es'
      ? { pending: 'Pendiente', approved: 'Publicado', rejected: 'Rechazado' }
      : { pending: 'Pending', approved: 'Published', rejected: 'Rejected' };

  if (field === 'price_cop' && typeof value === 'number') return fmtMoney(value, locale);
  if (field === 'area_m2' && typeof value === 'number') return `${value} m²`;
  if (typeof value === 'boolean') return value ? (locale === 'es' ? 'Sí' : 'Yes') : (locale === 'es' ? 'No' : 'No');
  const str = String(value);
  if (field === 'operation') return opLabels[str] ?? str;
  if (field === 'type') return typeLabels[str] ?? str;
  if (field === 'status') return statusLabels[str] ?? str;
  return str;
}

function formatChanges(locale: Locale, changes: Record<string, { from: unknown; to: unknown }>): string {
  const labels = FIELD_LABELS[locale];
  return Object.entries(changes)
    .slice(0, 8)
    .map(([field, c]) => {
      const name = labels[field] ?? field;
      const from = valueLabel(locale, field, c.from);
      const to = valueLabel(locale, field, c.to);
      if (from === to && String(c.from) === String(c.to)) return `${name}: (sin cambio)`;
      return `${name}: ${from} → ${to}`;
    })
    .join(' · ');
}

function formatDetail(locale: Locale, action: string, detail: Record<string, unknown>): string {
  if (!detail || Object.keys(detail).length === 0) return '—';

  const t = (es: string, en: string) => (locale === 'es' ? es : en);

  // Inmueble creado / solicitud recibida → resumen legible
  if (action === 'property.create' || action === 'submission.create') {
    const op = valueLabel(locale, 'operation', detail.operation);
    const ty = valueLabel(locale, 'type', detail.type);
    const bits = [String(detail.title ?? ''), op, ty, String(detail.city ?? '')].filter(Boolean);
    const summary = bits.join(' · ');
    const extra = action === 'submission.create' && detail.photo_count != null
      ? ` · ${t('Fotos', 'Photos')}: ${detail.photo_count}`
      : ` · ${t('Estado', 'Status')}: ${valueLabel(locale, 'status', detail.status)}`;
    return summary ? `${summary}${extra}` : extra.trim();
  }

  // Inmueble editado → lista de cambios legible
  if (action === 'property.update') {
    if (detail.note) return String(detail.note);
    if (detail.changes && typeof detail.changes === 'object') {
      return formatChanges(locale, detail.changes as Record<string, { from: unknown; to: unknown }>);
    }
  }

  // Cambio de estado
  if (action === 'property.status') {
    return `${t('Estado cambiado a', 'Status changed to')}: ${valueLabel(locale, 'status', detail.status)}`;
  }

  // Subida de foto
  if (action === 'photo.upload') {
    const size = typeof detail.size === 'number' ? Math.round(detail.size / 1024) : null;
    const file = String(detail.file ?? detail.path ?? '');
    return `${t('Foto subida', 'Photo uploaded')}: ${file}${size != null ? ` · ${size} KB` : ''}`;
  }

  // Eliminación de foto
  if (action === 'photo.delete') {
    return `${t('Foto eliminada', 'Photo deleted')}: ${String(detail.path ?? detail.image_id ?? '—')}`;
  }

  // Reordenado
  if (action === 'photos.reorder') {
    const n = Array.isArray(detail.order) ? detail.order.length : 0;
    return `${t('Se reordenaron', 'Reordered')} ${n} ${t('fotos', 'photos')}`;
  }

  // Eliminar todas las fotos
  if (action === 'photos.delete_all') {
    const n = typeof detail.image_count === 'number' ? detail.image_count : 0;
    return `${t('Se eliminaron todas las fotos', 'All photos deleted')} (${n})`;
  }

  // Limpieza automática
  if (action === 'cron.cleanup') {
    const purged = typeof detail.purged === 'number' ? detail.purged : 0;
    return `${t('Solicitudes purgadas', 'Purged submissions')}: ${purged}`;
  }

  // Contratos de arriendo
  if (action === 'lease.create' || action === 'lease.update') {
    const rent = typeof detail.rent_cop === 'number' ? fmtMoney(detail.rent_cop, locale) : '';
    const periods = typeof detail.periods === 'number' ? `${t('Meses', 'Months')}: ${detail.periods}` : '';
    const concepts = typeof detail.concepts === 'number' ? `${t('Extras', 'Extras')}: ${detail.concepts}` : '';
    const recalculated =
      typeof detail.recalculated === 'number'
        ? `${t('Recalculados', 'Recalculated')}: ${detail.recalculated}`
        : '';
    return [rent, periods, concepts, recalculated].filter(Boolean).join(' · ') || '—';
  }

  if (action === 'lease.status') {
    const status = String(detail.status ?? '—');
    return `${t('Nuevo estado', 'New status')}: ${status === 'active' ? t('activo', 'active') : t('finalizado', 'finished')}`;
  }

  if (action === 'lease.periods_generate') {
    return `${t('Generados', 'Inserted')}: ${String(detail.inserted ?? 0)} · ${t('Omitidos', 'Skipped')}: ${String(detail.skipped ?? 0)}`;
  }

  if (action === 'lease.period_update') {
    const amount = typeof detail.paid_cop === 'number' ? fmtMoney(detail.paid_cop, locale) : '';
    return [String(detail.period ?? ''), amount, String(detail.status ?? '')]
      .filter(Boolean)
      .join(' · ');
  }

  if (action === 'lease.receipt_upload') {
    const amount = typeof detail.amount_cop === 'number' ? fmtMoney(detail.amount_cop, locale) : '';
    return [String(detail.kind ?? ''), amount].filter(Boolean).join(' · ') || '—';
  }

  if (action === 'lease.receipt_delete') {
    return String(detail.path ?? '—');
  }

  // Roles
  if (action === 'role.permissions') {
    return Array.isArray(detail.permissions) ? detail.permissions.join(', ') : '—';
  }

  if (action === 'role.assign') {
    return `${t('Rol', 'Role')}: ${String(detail.role ?? '—')}`;
  }

  // Recordatorios automáticos
  if (action === 'cron.lease_reminders') {
    const candidates = typeof detail.candidates === 'number' ? detail.candidates : 0;
    return `${t('Candidatos', 'Candidates')}: ${candidates} · ${t('Enviados', 'Sent')}: ${String(detail.sent ?? 0)} · ${t('Fallidos', 'Failed')}: ${String(detail.failed ?? 0)}`;
  }

  // Cerebro interno
  if (action === 'knowledge.ask') {
    return [
      `${t('En caché', 'Cached')}: ${detail.cached ? t('sí', 'yes') : t('no', 'no')}`,
      `${t('Fuentes', 'Sources')}: ${String(detail.sources ?? 0)}`,
      typeof detail.latency_ms === 'number' ? `${detail.latency_ms} ms` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  if (action === 'knowledge.sync' || action === 'cron.knowledge_sync') {
    return [
      `${t('Documentos', 'Documents')}: ${String(detail.documents ?? 0)}`,
      `${t('Fragmentos', 'Chunks')}: ${String(detail.chunks ?? 0)}`,
      `${t('Vectorizados', 'Embedded')}: ${String(detail.embedded ?? 0)}`,
      `${t('Omitidos', 'Skipped')}: ${String(detail.skipped ?? 0)}`,
      typeof detail.duration_ms === 'number' ? `${detail.duration_ms} ms` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  // Login / sesión
  if (action === 'admin.login' || action === 'admin.logout' || action === 'admin.login_failed' ||
      action === 'admin.unauthorized') {
    if (detail.session_verified != null) return String(detail.session_verified);
    if (detail.reason) return String(detail.reason);
    return '—';
  }

  // Fallback técnico (los técnicos pueden ver el detalle crudo)
  return Object.entries(detail)
    .slice(0, 6)
    .map(([k, v]) => `${FIELD_LABELS[locale][k] ?? k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' · ');
}

export default async function AuditoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; action?: string }>;
}) {
  const { locale } = await params;
  const { q = '', action = '' } = await searchParams;
  const auth = await getSessionAuth();
  if (!hasPermission(auth, 'audit.view')) {
    redirect({ href: '/admin', locale });
    return null;
  }
  const t = await getTranslations({ locale, namespace: 'admin.audit' });

  const supabase = createSupabaseAdminClient();
  let rows: AuditRow[] = [];
  let error = false;

  if (supabase) {
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);
    if (action) query = query.eq('action', action);
    if (q.trim()) {
      const term = q.trim();
      query = query.or(`actor_email.ilike.%${term}%,entity_id.eq.${term},ip.ilike.%${term}%`);
    }
    const { data, error: qErr } = await query;
    if (!qErr) rows = (data ?? []) as AuditRow[];
    else error = true;
  } else {
    error = true;
  }

  const fmtDate = new Intl.DateTimeFormat(locale === 'es' ? 'es-CO' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'America/Bogota',
  });

  const inputCls =
    'w-full rounded-xl border border-ajin-border bg-white px-3 py-2 text-sm text-ajin-text focus:border-ajin-accent focus:outline-none sm:w-auto';
  const thCls = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ajin-gray-400';
  const tdCls = 'px-3 py-2.5 align-top text-xs text-ajin-text';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-ajin-primary">
            <ScrollText size={22} /> {t('title')}
          </h1>
          <p className="mt-1 text-sm text-ajin-gray-400">{t('subtitle')}</p>
        </div>
      </div>

      <form method="GET" className="mt-5 flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder={`${t('searchPlaceholder')}`}
          className={inputCls}
        />
        <select name="action" defaultValue={action} className={inputCls}>
          <option value="">{t('allActions')}</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {t.has(`actions.${a.replace('.', '_')}`) ? t(`actions.${a.replace('.', '_')}`) : a}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-ajin-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ajin-accent hover:text-ajin-primary"
        >
          {t('apply')}
        </button>
        {(q || action) && (
          <a href={`/${locale}/admin/auditoria`} className="text-sm text-ajin-gray-400 underline hover:text-ajin-primary">
            {t('clear')}
          </a>
        )}
      </form>

      {error ? (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <ShieldQuestion size={16} /> {t('loadError')}
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white px-4 py-6 text-center text-sm text-ajin-gray-400 shadow-sm">
          {t('empty')}
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-ajin-border bg-ajin-surface">
              <tr>
                <th className={thCls}>{t('colTime')}</th>
                <th className={thCls}>{t('colAction')}</th>
                <th className={thCls}>{t('colActor')}</th>
                <th className={thCls}>{t('colEntity')}</th>
                <th className={thCls}>{t('colDetail')}</th>
                <th className={thCls}>{t('colIp')}</th>
                <th className={thCls}>{t('colDevice')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ajin-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-ajin-surface/60">
                  <td className={`${tdCls} whitespace-nowrap`}>{fmtDate.format(new Date(row.created_at))}</td>
                  <td className={tdCls}>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        row.action.includes('failed') || row.action.includes('unauthorized')
                          ? 'bg-red-100 text-red-700'
                          : row.action.startsWith('submission')
                            ? 'bg-blue-100 text-blue-700'
                            : row.action.startsWith('admin.')
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {t.has(`actions.${row.action.replace('.', '_')}`)
                        ? t(`actions.${row.action.replace('.', '_')}`)
                        : row.action}
                    </span>
                  </td>
                  <td className={tdCls}>{row.actor_email || '—'}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>
                    {row.entity_id ? (
                      row.action.startsWith('lease.') ? (
                        <a
                          href={`/${locale}/admin/arriendos/${row.entity_id}`}
                          className="font-semibold text-ajin-primary underline decoration-ajin-accent underline-offset-2"
                        >
                          #{row.entity_id}
                        </a>
                      ) : row.action.startsWith('role.') || row.action.startsWith('cron.') ? (
                        <span className="font-medium text-ajin-gray-400">{row.entity_id}</span>
                      ) : (
                        <a
                          href={`/${locale}/admin/inmuebles/${row.entity_id}`}
                          className="font-semibold text-ajin-primary underline decoration-ajin-accent underline-offset-2"
                        >
                          #{row.entity_id}
                        </a>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={`${tdCls} max-w-[320px] break-words text-ajin-gray-400`}>
                    {formatDetail(locale as Locale, row.action, row.detail)}
                  </td>
                  <td className={`${tdCls} whitespace-nowrap`}>{row.ip || '—'}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>{deviceLabel(row.user_agent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-ajin-gray-400">{t('limitNote')}</p>
    </div>
  );
}
