import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAllPosts, getPost } from '@/lib/blog';
import { landingPages, serviceGroups } from '@/data/services';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import es from '@/i18n/messages/es.json';
import en from '@/i18n/messages/en.json';

/**
 * Construye la lista de documentos que alimentan el cerebro. No escribe en
 * la base: el indexador decide qué cambió y qué hay que vectorizar.
 *
 * Los datos sensibles (cédulas, teléfonos y correos de inquilinos y
 * propietarios) solo se incluyen si KNOWLEDGE_INCLUDE_PII=true. Los nombres
 * sí van siempre, porque son necesarios para responder preguntas internas.
 */

export type KnowledgeSourceType =
  | 'property'
  | 'lease'
  | 'lease_period'
  | 'blog'
  | 'service'
  | 'landing'
  | 'site';

export interface KnowledgeDocInput {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  locale: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeBuildResult {
  docs: KnowledgeDocInput[];
  warnings: string[];
}

interface PropertyRow {
  id: number;
  operation: string;
  type: string;
  title: string;
  description: string;
  price_cop: number;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  stratum: number | null;
  neighborhood: string;
  city: string;
  department: string;
  status: string;
  featured: boolean;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  source: string;
  created_at: string;
  published_at: string | null;
}

interface LeaseRow {
  id: number;
  property_id: number;
  tenant_name: string;
  tenant_phone: string;
  tenant_email: string;
  tenant_document: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  owner_document: string;
  rent_cop: number;
  building_fee_cop: number;
  agency_mode: 'percent' | 'fixed';
  agency_value: number;
  payment_day: number;
  start_date: string;
  end_date: string | null;
  status: string;
  notes: string;
  created_at: string;
}

interface PeriodRow {
  id: number;
  lease_id: number;
  period: string;
  due_date: string;
  rent_cop: number;
  building_cop: number;
  agency_cop: number;
  extras_tenant_cop: number;
  extras_owner_cop: number;
  total_due_cop: number;
  owner_payout_cop: number;
  paid_cop: number;
  status: string;
  paid_at: string | null;
  payout_paid_at: string | null;
  notes: string;
}

interface ConceptRow {
  id: number;
  lease_id: number;
  name: string;
  amount_cop: number;
  charge_tenant: boolean;
  deduct_owner: boolean;
  active: boolean;
}

interface ReceiptRow {
  id: number;
  lease_id: number;
  period_id: number | null;
  kind: string;
  label: string;
  amount_cop: number | null;
  created_at: string;
}

const MESSAGES = { es, en } as const;

const OPERATION_LABEL: Record<string, string> = { venta: 'Venta', arriendo: 'Arriendo' };
const TYPE_LABEL: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  oficina: 'Oficina',
  lote: 'Lote',
  bodega: 'Bodega',
};
const PROPERTY_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente de revisión',
  approved: 'Publicado',
  rejected: 'Rechazado',
};
const PERIOD_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Abono parcial',
  paid: 'Pagado',
};
const RECEIPT_KIND_LABEL: Record<string, string> = {
  invoice: 'Cuenta de cobro',
  payment: 'Comprobante de pago',
  building: 'Administración',
  utility: 'Servicio público',
  payout: 'Giro al propietario',
  other: 'Otro',
};

export function includePii(): boolean {
  return (process.env.KNOWLEDGE_INCLUDE_PII ?? '').trim().toLowerCase() === 'true';
}

function money(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(value))}`;
}

function day(value: string | null | undefined): string {
  if (!value) return '—';
  return value.slice(0, 10);
}

function contact(name: string, phone: string, email: string, document: string): string {
  const parts = [name || '—'];
  if (includePii()) {
    if (phone) parts.push(`tel. ${phone}`);
    if (email) parts.push(email);
    if (document) parts.push(`doc. ${document}`);
  }
  return parts.join(' · ');
}

function propertyLabel(
  property: { title: string; city: string; neighborhood: string } | null,
  fallback: number
): string {
  if (!property) return `Inmueble #${fallback}`;
  const place = [property.neighborhood, property.city].filter(Boolean).join(', ');
  return `${property.title}${place ? ` (${place})` : ''} [#${fallback}]`;
}

function flattenStrings(value: unknown, key = ''): string[] {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return [];
    // Microcopy de formularios y navegación: no aporta al cerebro.
    if (/placeholder|submit|button|requerid|required|invalid|sending|sent|success|error|optional|menu|nav/i.test(key)) {
      return [];
    }
    return [text];
  }
  if (Array.isArray(value)) return value.flatMap((item) => flattenStrings(item, key));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([childKey, child]) => {
      if (childKey === 'form' || /placeholder|submit|button|required|invalid|sending|error|menu|nav/i.test(childKey)) {
        return [];
      }
      return flattenStrings(child, childKey);
    });
  }
  return [];
}

function siteDoc(
  locale: string,
  sourceId: string,
  title: string,
  path: string,
  topic: unknown,
  extra: string[] = []
): KnowledgeDocInput {
  const values = flattenStrings(topic);
  const content = [`Tema: ${title}`, ...extra, ...values].filter(Boolean).join('\n');
  return {
    sourceType: 'site',
    sourceId,
    locale,
    title,
    content,
    metadata: { url: path || '/' },
  };
}

async function propertyDocs(warnings: string[]): Promise<KnowledgeDocInput[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    warnings.push('Supabase no configurado: no se indexaron inmuebles ni arriendos.');
    return [];
  }

  const { data, error } = await supabase.from('properties').select('*').order('id');
  if (error) {
    warnings.push(`Inmuebles: ${error.message}`);
    return [];
  }

  return ((data ?? []) as PropertyRow[]).map((property) => {
    const lines = [
      `Inmueble #${property.id}`,
      `Título: ${property.title}`,
      `Operación: ${OPERATION_LABEL[property.operation] ?? property.operation}`,
      `Tipo: ${TYPE_LABEL[property.type] ?? property.type}`,
      `Estado: ${PROPERTY_STATUS_LABEL[property.status] ?? property.status}`,
      `Precio: ${money(property.price_cop)} COP`,
      `Ubicación: ${[property.neighborhood, property.city, property.department].filter(Boolean).join(', ')}`,
      `Área: ${property.area_m2 ? `${property.area_m2} m²` : '—'}`,
      `Habitaciones: ${property.bedrooms ?? '—'} · Baños: ${property.bathrooms ?? '—'} · Parqueaderos: ${property.parking ?? '—'} · Estrato: ${property.stratum ?? '—'}`,
      `Destacado: ${property.featured ? 'sí' : 'no'}`,
      `Origen: ${property.source === 'client' ? 'solicitud del cliente' : 'carga del panel'}`,
      `Creado: ${day(property.created_at)} · Publicado: ${day(property.published_at)}`,
      `Propietario: ${property.owner_name}` +
        (includePii()
          ? ` · tel. ${property.owner_phone || '—'} · ${property.owner_email || '—'}`
          : ''),
      `Descripción: ${property.description}`,
    ];

    return {
      sourceType: 'property' as const,
      sourceId: String(property.id),
      locale: '',
      title: `Inmueble #${property.id} · ${property.title}`,
      content: lines.join('\n'),
      metadata: {
        url: `/inmuebles/${property.id}`,
        status: property.status,
        operation: property.operation,
      },
    };
  });
}

async function leaseDocs(warnings: string[]): Promise<KnowledgeDocInput[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const [leaseRes, conceptRes, periodRes, receiptRes, propertyRes] = await Promise.all([
    supabase.from('leases').select('*').order('id'),
    supabase.from('lease_concepts').select('*').order('id'),
    supabase.from('lease_periods').select('*').order('id'),
    supabase
      .from('lease_receipts')
      .select('id, lease_id, period_id, kind, label, amount_cop, created_at')
      .order('created_at'),
    supabase.from('properties').select('id, title, city, neighborhood'),
  ]);

  for (const [label, result] of [
    ['Contratos', leaseRes],
    ['Conceptos', conceptRes],
    ['Mensualidades', periodRes],
    ['Soportes', receiptRes],
  ] as const) {
    if (result.error) warnings.push(`${label}: ${result.error.message}`);
  }
  if (leaseRes.error) return [];

  const properties = new Map<number, { title: string; city: string; neighborhood: string }>();
  for (const row of (propertyRes.data ?? []) as Array<{
    id: number;
    title: string;
    city: string;
    neighborhood: string;
  }>) {
    properties.set(row.id, row);
  }

  const concepts = new Map<number, ConceptRow[]>();
  for (const row of (conceptRes.data ?? []) as ConceptRow[]) {
    concepts.set(row.lease_id, [...(concepts.get(row.lease_id) ?? []), row]);
  }
  const periods = new Map<number, PeriodRow[]>();
  for (const row of (periodRes.data ?? []) as PeriodRow[]) {
    periods.set(row.lease_id, [...(periods.get(row.lease_id) ?? []), row]);
  }
  const receipts = new Map<number, ReceiptRow[]>();
  for (const row of (receiptRes.data ?? []) as ReceiptRow[]) {
    receipts.set(row.lease_id, [...(receipts.get(row.lease_id) ?? []), row]);
  }
  const periodById = new Map<number, PeriodRow>();
  for (const list of periods.values()) for (const row of list) periodById.set(row.id, row);

  const docs: KnowledgeDocInput[] = [];

  for (const lease of (leaseRes.data ?? []) as LeaseRow[]) {
    const property = properties.get(lease.property_id) ?? null;
    const leaseConcepts = concepts.get(lease.id) ?? [];
    const leasePeriods = periods.get(lease.id) ?? [];
    const leaseReceipts = receipts.get(lease.id) ?? [];

    const lines = [
      `Contrato de arriendo #${lease.id}`,
      `Estado: ${lease.status === 'active' ? 'Activo' : 'Finalizado'}`,
      `Inmueble: ${propertyLabel(property, lease.property_id)}`,
      `Inquilino: ${contact(lease.tenant_name, lease.tenant_phone, lease.tenant_email, lease.tenant_document)}`,
      `Propietario: ${contact(lease.owner_name, lease.owner_phone, lease.owner_email, lease.owner_document)}`,
      `Canon mensual: ${money(lease.rent_cop)} COP`,
      `Administración del conjunto: ${money(lease.building_fee_cop)} COP (la paga el propietario y se descuenta del giro)`,
      `Comisión de la inmobiliaria: ${
        lease.agency_mode === 'percent'
          ? `${lease.agency_value}% del canon`
          : `${money(lease.agency_value)} COP fijos`
      }`,
      `Día de pago: ${lease.payment_day} de cada mes`,
      `Vigencia: ${day(lease.start_date)} → ${lease.end_date ? day(lease.end_date) : 'sin fecha de fin'}`,
      `Creado: ${day(lease.created_at)}`,
      lease.notes ? `Notas: ${lease.notes}` : '',
      '',
      'Conceptos adicionales:',
      ...(leaseConcepts.length === 0
        ? ['- Sin conceptos adicionales.']
        : leaseConcepts.map((concept) => {
            const flags = [
              concept.charge_tenant ? 'se cobra al inquilino' : '',
              concept.deduct_owner ? 'se descuenta del giro al propietario' : '',
              concept.active ? '' : 'inactivo',
            ].filter(Boolean);
            return `- ${concept.name}: ${money(concept.amount_cop)} COP (${flags.join(', ') || 'sin efecto'})`;
          })),
      '',
      `Soportes cargados: ${leaseReceipts.length}`,
      ...leaseReceipts.slice(0, 40).map((receipt) => {
        const period = receipt.period_id ? periodById.get(receipt.period_id) : null;
        return `- ${RECEIPT_KIND_LABEL[receipt.kind] ?? receipt.kind}${
          receipt.label ? ` (${receipt.label})` : ''
        }${receipt.amount_cop ? ` · ${money(receipt.amount_cop)}` : ''}${
          period ? ` · ${period.period}` : ''
        } · ${day(receipt.created_at)}`;
      }),
      '',
      `Mensualidades registradas: ${leasePeriods.length}`,
    ];

    docs.push({
      sourceType: 'lease',
      sourceId: String(lease.id),
      locale: '',
      title: `Contrato #${lease.id} · ${lease.tenant_name}`,
      content: lines.filter((line) => line !== undefined).join('\n'),
      metadata: {
        url: `/admin/arriendos/${lease.id}`,
        status: lease.status,
        property_id: lease.property_id,
        tenant_name: lease.tenant_name,
        rent_cop: lease.rent_cop,
      },
    });

    for (const period of leasePeriods) {
      const periodLines = [
        `Mensualidad ${period.period} del contrato #${lease.id}`,
        `Inmueble: ${propertyLabel(property, lease.property_id)}`,
        `Inquilino: ${lease.tenant_name}`,
        `Propietario: ${lease.owner_name}`,
        `Vence: ${day(period.due_date)}`,
        `Canon: ${money(period.rent_cop)} COP`,
        `Administración del conjunto: ${money(period.building_cop)} COP`,
        `Comisión: ${money(period.agency_cop)} COP`,
        `Extras que paga el inquilino: ${money(period.extras_tenant_cop)} COP`,
        `Gastos del propietario: ${money(period.extras_owner_cop)} COP`,
        `Total a cobrar al inquilino: ${money(period.total_due_cop)} COP`,
        `Giro al propietario: ${money(period.owner_payout_cop)} COP`,
        `Pagado por el inquilino: ${money(period.paid_cop)} COP`,
        `Estado: ${PERIOD_STATUS_LABEL[period.status] ?? period.status}`,
        `Fecha de pago: ${day(period.paid_at)} · Giro entregado: ${day(period.payout_paid_at)}`,
        period.notes ? `Notas: ${period.notes}` : '',
      ];

      docs.push({
        sourceType: 'lease_period',
        sourceId: String(period.id),
        locale: '',
        title: `Mensualidad ${period.period} · contrato #${lease.id}`,
        content: periodLines.filter(Boolean).join('\n'),
        metadata: {
          url: `/admin/arriendos/${lease.id}`,
          lease_id: lease.id,
          period: period.period,
          status: period.status,
          due_date: period.due_date,
        },
      });
    }
  }

  return docs;
}

function blogDocs(): KnowledgeDocInput[] {
  const docs: KnowledgeDocInput[] = [];
  for (const locale of ['es', 'en'] as const) {
    for (const meta of getAllPosts(locale)) {
      const post = getPost(meta.slug, locale);
      docs.push({
        sourceType: 'blog',
        sourceId: `${locale}/${meta.slug}`,
        locale,
        title: `Artículo: ${post.title}`,
        content: [
          `Artículo del blog de ${SITE_NAME}`,
          `Título: ${post.title}`,
          `Categoría: ${post.category}`,
          `Autor: ${post.author}`,
          `Fecha: ${post.date}`,
          `Descripción: ${post.description}`,
          '',
          post.content,
        ].join('\n'),
        metadata: { url: `/blog/${meta.slug}` },
      });
    }
  }
  return docs;
}

function serviceDocs(): KnowledgeDocInput[] {
  const docs: KnowledgeDocInput[] = [];
  for (const locale of ['es', 'en'] as const) {
    const messages = MESSAGES[locale].services as Record<string, unknown>;
    for (const group of serviceGroups) {
      const data = messages[group.id] as
        | { title?: string; description?: string; items?: string[] }
        | undefined;
      if (!data?.title) continue;
      docs.push({
        sourceType: 'service',
        sourceId: `${locale}/${group.slug}`,
        locale,
        title: `Servicio: ${data.title}`,
        content: [
          `Servicio de ${SITE_NAME}`,
          `Título: ${data.title}`,
          `Descripción: ${data.description ?? ''}`,
          'Incluye:',
          ...(data.items ?? []).map((item) => `- ${item}`),
        ].join('\n'),
        metadata: { url: `/servicios/${group.slug}` },
      });
    }
  }
  return docs;
}

function landingDocs(): KnowledgeDocInput[] {
  const docs: KnowledgeDocInput[] = [];
  for (const locale of ['es', 'en'] as const) {
    const messages = MESSAGES[locale].landing as Record<string, unknown>;
    for (const page of landingPages) {
      const key = page.titleKey.split('.')[1];
      const data = messages[key] as
        | { title?: string; description?: string; items?: string[] }
        | undefined;
      if (!data?.title) continue;
      docs.push({
        sourceType: 'landing',
        sourceId: `${locale}/${page.slug}`,
        locale,
        title: `Página: ${data.title}`,
        content: [
          `Página de servicio de ${SITE_NAME}`,
          `Título: ${data.title}`,
          `Descripción: ${data.description ?? ''}`,
          'Temas:',
          ...(data.items ?? []).map((item) => `- ${item}`),
        ].join('\n'),
        metadata: { url: `/landing/${page.slug}` },
      });
    }
  }
  return docs;
}

function siteDocs(): KnowledgeDocInput[] {
  const docs: KnowledgeDocInput[] = [];

  docs.push({
    sourceType: 'site',
    sourceId: 'firma',
    locale: '',
    title: `Datos de ${SITE_NAME}`,
    content: [
      `Firma: ${SITE_NAME} — ${SITE_TAGLINE}`,
      'Sitio web: ' + SITE_URL,
      'Teléfono / WhatsApp: +57 350 433 8533',
      'Correo: asesoriainmobiliariaynotarial@gmail.com',
      'Dirección: Calle 12 # 13-26, Chía, Cundinamarca, Colombia',
      'Horario: lunes a viernes, 9:00 a 18:00',
      'Zonas de atención: Bogotá, Chía y Cundinamarca',
      'Servicios: derecho inmobiliario, notarial, familia y sucesiones, comercial y corporativo, laboral.',
    ].join('\n'),
    metadata: { url: '/contacto' },
  });

  for (const locale of ['es', 'en'] as const) {
    const messages = MESSAGES[locale];
    docs.push(siteDoc(locale, `${locale}/nosotros`, 'Nosotros', '/nosotros', messages.about));
    docs.push(siteDoc(locale, `${locale}/home`, 'Inicio', '', messages.home));
    docs.push(siteDoc(locale, `${locale}/contacto`, 'Contacto', '/contacto', messages.contact));
    docs.push(siteDoc(locale, `${locale}/poderes`, 'Poderes', '/poderes', messages.powers));
    docs.push(siteDoc(locale, `${locale}/privacidad`, 'Privacidad', '/privacidad', messages.privacy));
    docs.push(siteDoc(locale, `${locale}/terminos`, 'Términos', '/terminos', messages.terms));
    docs.push(
      siteDoc(locale, `${locale}/datos-personales`, 'Datos personales', '/datos-personales', messages.dataProtection)
    );
  }

  return docs;
}

export async function buildKnowledgeDocs(): Promise<KnowledgeBuildResult> {
  const warnings: string[] = [];
  const [properties, leases] = await Promise.all([
    propertyDocs(warnings).catch((error: unknown) => {
      warnings.push(`Inmuebles: ${String(error)}`);
      return [] as KnowledgeDocInput[];
    }),
    leaseDocs(warnings).catch((error: unknown) => {
      warnings.push(`Arriendos: ${String(error)}`);
      return [] as KnowledgeDocInput[];
    }),
  ]);

  const docs = [...properties, ...leases, ...blogDocs(), ...serviceDocs(), ...landingDocs(), ...siteDocs()];

  // Un mismo documento no puede repetirse: la tabla tiene unique por
  // (source_type, source_id, locale).
  const unique = new Map<string, KnowledgeDocInput>();
  for (const doc of docs) {
    const key = `${doc.sourceType}|${doc.sourceId}|${doc.locale}`;
    if (!unique.has(key)) unique.set(key, doc);
  }

  return { docs: [...unique.values()].filter((doc) => doc.content.trim().length > 0), warnings };
}
