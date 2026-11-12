# AJIN — Asesoría Jurídica Inmobiliaria y Notarial

Sitio web corporativo bilingüe (ES/EN) para una firma de abogados colombiana especializada en derecho inmobiliario, notarial, familia y corporativo.

## Stack

- Next.js 15.5.18 + React 19
- Tailwind CSS 4 + @tailwindcss/typography
- next-intl (i18n)
- react-hook-form
- @supabase/supabase-js + @supabase/ssr (marketplace de inmuebles)
- @vercel/analytics
- Hosting: Vercel

## Requisitos

- Node.js 18+
- npm

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # llenar TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID
npm run dev                   # http://localhost:3000/es
```

## Build

```bash
npm run build   # typecheck + SSG (78 páginas prerenderizadas; sitemap 56 URLs fijas + inmuebles aprobados)
```

## Despliegue

Conectado al repo de GitHub en Vercel. Las variables de entorno se configuran en el dashboard de Vercel. El dominio `ajinabogados.online` se gestiona en Alibaba Cloud DNS (nameservers `ns7/ns8.alidns.com`) y apunta a Vercel.

## Estructura

```
src/
├── app/[locale]/     # Rutas Next.js (i18n)
├── components/       # UI y secciones
├── content/{es,en}/  # Blog en Markdown
├── data/             # Config de servicios y landing pages
├── i18n/             # Traducciones y routing
└── lib/              # Utilidades (blog, site, Telegram/email, helpers)
```

## Formularios

Los envíos de formularios (`/contacto`, `/poderes`, y los `LeadForm` en las landing pages → `/api/asesoria`) se envían en paralelo a Telegram y email (SMTP Gmail), más n8n (futuro, opcional vía `NEXT_PUBLIC_N8N_WEBHOOK_BASE`). Al enviar, también se abre `wa.me` con el mensaje prellenado. Ver `.env.example`.

---

## Marketplace de Inmuebles

Sección visual de propiedades en venta y arriendo sobre Supabase (Postgres + Storage + Auth).

### Configuración (una vez)

1. Ejecutar `supabase-setup.sql` en el **SQL Editor** de Supabase: crea tablas `properties` / `property_images`, RLS (lectura pública solo de inmuebles `approved` y de sus fotos) y el bucket público `inmuebles` (límite 5 MB por archivo). Si las tablas ya existían, volver a ejecutar el bloque 3 para aplicar la política de privacidad de fotos.
2. Crear los usuarios admin en **Authentication → Users** (email/password, Auto Confirm). Los emails de `ADMIN_EMAILS` son administradores; el resto de usuarios con acceso se gestiona en `/es/admin/roles` (ver sección Arriendos).
3. Variables en Vercel (todas pueden marcarse **Sensitive** — sin prefijo `NEXT_PUBLIC_`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `CRON_SECRET` y, opcional pero recomendada, `UPLOAD_TOKEN_SECRET` (secreto HMAC que autoriza la subida de fotos de una solicitud; si falta se usa `CRON_SECRET` y luego la service-role key). El cliente de navegador recibe URL/anon key como props desde Server Components.

### Flujo de publicación (ES)

| Paso | Descripción |
|---|---|
| Cliente | Completa `/es/inmuebles/publicar`: metadata JSON (`POST /api/inmuebles/solicitud`, rate-limit 5/h) y fotos una a una (`POST /api/inmuebles/solicitud/{id}/foto`, máx 15) con el header `x-upload-token` que devuelve la creación. Fotos se comprimen a WebP en el navegador. Queda `pending` y notifica a Telegram/email. |
| Purga | Vercel Cron diario elimina solicitudes sin aprobar con más de 30 días (`GET /api/cron/cleanup-pending`, protegido con `CRON_SECRET`). |
| Admin | Entra por `/es/admin/login`. Lista con tabs Pendientes/Publicados/Rechazados; aprobar o rechazar inline; editor completo con fotos (subir, borrar, reordenar, portada) en `/es/admin/inmuebles/{id}`. |
| Público | `/es/inmuebles` lista aprobados con filtros (ISR 60 s); detalle `/es/inmuebles/{id}` con galería lightbox y formulario de contacto. |

### Property flow (EN)

| Step | Description |
|---|---|
| Client | Submits `/en/inmuebles/publicar`: metadata JSON first, then photos one by one (max 15) using the `x-upload-token` header returned at creation, converted to WebP in-browser. Stored as `pending`; Telegram/email notification sent. |
| Cleanup | Daily Vercel cron deletes unapproved requests older than 30 days (Bearer-protected with `CRON_SECRET`). |
| Admin | Signs in at `/en/admin/login`; status tabs, inline approve/reject, full photo manager in the editor. |
| Public | `/en/inmuebles` lists approved properties with filters (ISR 60 s); detail page with lightbox gallery and lead form. |

Security: every write goes through API routes using the service-role key; the anon key is read-only via RLS (approved properties and their photos only). Photo uploads for a new request require the HMAC token returned by the creation endpoint, so nobody can attach photos to someone else's listing. Panel access is role-based: emails in `ADMIN_EMAILS` are always admins; other users need a row in `user_roles` (roles `admin` / `gestor`). Middleware enforces the session, and the guarded layout plus every `/api/admin/*` route enforce the role and its permissions.

---

## Arriendos (gestión posterior al anuncio)

Módulo para administrar un inmueble cuando ya se arrendó: cobrar el canon, pagar la administración del conjunto, descontar la comisión de la inmobiliaria y girar el saldo al propietario, con soportes (cuentas de cobro, facturas, comprobantes) y recordatorios por Telegram.

### Configuración (una vez)

1. **Respalda la base**: Supabase → Database → Backups.
2. Ejecutar `supabase-arriendos.sql` en el **SQL Editor**. Solo crea objetos nuevos (`user_roles`, `role_permissions`, `leases`, `lease_concepts`, `lease_periods`, `lease_receipts`), el bucket privado `recibos` (5 MB, JPG/PNG/WebP/PDF) y los permisos iniciales. No borra tablas ni filas; se puede volver a ejecutar.
3. Crear los usuarios del panel en **Authentication → Users** (email/password). Los de `ADMIN_EMAILS` entran como administradores; para el resto, asignar rol en `/es/admin/roles` (o dejar que un admin lo haga).
4. No hay variables nuevas: se reutilizan `SUPABASE_*`, `ADMIN_EMAILS`, `CRON_SECRET` y `TELEGRAM_*`. El cron de recordatorios necesita `CRON_SECRET` en Vercel.

### Flujo de gestión (ES)

| Paso | Descripción |
|---|---|
| Contrato | Desde `/es/admin/arriendos/nuevo` (o el botón “Administrar arriendo” del inmueble): inmueble, inquilino, propietario, canon, administración, comisión (% por defecto 10 % o monto fijo), día de pago, servicios extras y fechas. |
| Mensualidades | Se generan al crear el contrato (hasta 11 meses o el fin pactado) y con “Generar meses” en el detalle. Cada mes guarda el cobro (`canon + administración + extras del inquilino`) y el giro (`canon + extras cobrados − comisión − gastos del propietario`). |
| Pagos | En `/es/admin/arriendos/{id}` se registra el pago (total o abono), la fecha y el giro al propietario. Los meses pagados no se recalculan al editar el contrato. |
| Soportes | Se suben imágenes o PDF (máx. 5 MB) asociados a un mes y a un tipo: cuenta de cobro, comprobante, administración, servicio público, giro u otro. El bucket es privado: se abren con URL firmada de 1 hora. |
| Roles | `/es/admin/roles` muestra los dos roles (`admin`, `gestor`), sus permisos editables y los usuarios con acceso. El rol `admin` conserva siempre el permiso de roles para no perder el panel. |
| Recordatorios | Vercel Cron diario (`0 13 * * *`, 8:00 Bogotá) ejecuta `/api/cron/lease-reminders` con `Authorization: Bearer CRON_SECRET`; avisa por Telegram los días configurados (por defecto 5 y 1 antes), el día de pago y al quedar vencido, sin repetir la misma etapa. |

### Lease flow (EN)

| Step | Description |
|---|---|
| Contract | Create it at `/en/admin/arriendos/nuevo` (or “Manage lease” from the property editor) with property, tenant, owner, rent, building fee, commission (10 % by default or fixed amount), payment day, extra services and dates. |
| Monthly periods | Generated on creation (up to 11 months or the agreed end date) and via “Generate months”. Each month stores the amount to collect and the owner payout. |
| Payments | Record full or partial payments, payment date and owner payout. Paid months are never recalculated when the contract changes. |
| Receipts | Upload images or PDFs (max 5 MB) linked to a month and a kind (invoice, payment proof, building fee, utility, payout, other). Private bucket, 1-hour signed URLs. |
| Roles | `/en/admin/roles` lists the two roles, editable permissions and users with access. The `admin` role always keeps the roles permission. |
| Reminders | Daily Vercel cron calls the reminders endpoint with `CRON_SECRET` and sends Telegram notices before the due date, on the due date and when overdue, never repeating the same stage. |

---

## SEO

El sitio implementa SEO técnico completo con una única fuente de verdad (`src/lib/site.ts`): `SITE_URL` (env `NEXT_PUBLIC_SITE_URL`, fallback `https://ajinabogados.online`), `SITE_NAME`, `OG_IMAGE_URL` y `buildAlternates()`. Para cambiar el dominio solo se toca una variable.

| Pieza | Por qué / qué hace |
|---|---|
| **Canonical + hreflang** (`buildAlternates`) | Cada página declara su canonical y sus alternates `/es` y `/en`. Evita contenido duplicado: Google fusiona el ranking de las versiones en vez de repartirlo. |
| **Open Graph / Twitter card** | `og:title`, `og:description`, `og:image` (1200×630, `public/images/og-image.png`, generada con PIL) y `twitter:card=summary_large_image`. Al compartir en WhatsApp/Facebook/X se muestra tarjeta con la imagen de marca. |
| **JSON-LD structured data** (`<JsonLd>`) | Datos legibles por máquina para *rich results*: `LegalService` (global: dirección real en Chía, teléfono, geolocalización, horario), `Service` (cada servicio), `Blog` y `BlogPosting` (fecha, autor, publisher, `mainEntityOfPage`). |
| **Google site verification** | Search Console verificado por **método Dominio (registro DNS TXT en Alibaba Cloud)** — permanente y no requiere el meta tag. El layout emite `<meta name="google-site-verification">` solo si `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` está definida (por si se revierte al método HTML). |
| **Sitemap + robots** (`sitemap.ts`, `robots.ts`) | Sitemap con 56 URLs fijas (18 páginas estáticas × 2 idiomas + 10 posts del blog × 2 idiomas) más cada inmueble aprobado en ambos idiomas, y `robots.txt` con `disallow: /api/, /_next/`. Enviar en Search Console → Sitemaps. |

### English

The site ships complete technical SEO with a single source of truth (`src/lib/site.ts`): `SITE_URL` (env `NEXT_PUBLIC_SITE_URL`, fallback `https://ajinabogados.online`), `SITE_NAME`, `OG_IMAGE_URL` and `buildAlternates()`. Changing the domain is a one-variable edit.

| Piece | Why / what it does |
|---|---|
| **Canonical + hreflang** (`buildAlternates`) | Every page declares its canonical URL and its `/es` and `/en` alternates. Prevents duplicate content: Google merges ranking across locales instead of splitting it. |
| **Open Graph / Twitter card** | `og:title`, `og:description`, `og:image` (1200×630, `public/images/og-image.png`, generated with PIL) and `twitter:card=summary_large_image`. Links shared on WhatsApp/Facebook/X render as rich cards with the brand image. |
| **JSON-LD structured data** (`<JsonLd>`) | Machine-readable data for rich results: `LegalService` (global: real address in Chía, phone, geo, opening hours), `Service` (each service), `Blog` and `BlogPosting` (date, author, publisher, `mainEntityOfPage`). |
| **Google site verification** | Search Console is verified via the **Domain method (DNS TXT record in Alibaba Cloud)** — permanent and no meta tag needed. The layout only emits `<meta name="google-site-verification">` if `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is set (in case it reverts to the HTML-tag method). |
| **Sitemap + robots** (`sitemap.ts`, `robots.ts`) | Sitemap with 56 fixed URLs (18 static pages × 2 locales + 10 blog posts × 2 locales) plus every approved property in both locales, and `robots.txt` with `disallow: /api/, /_next/`. Submit at Search Console → Sitemaps. |
