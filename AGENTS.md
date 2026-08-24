# AJIN

Next.js 15.5.18 + Tailwind CSS 4 + next-intl bilingual (ES/EN) site for AJIN Asesoría Jurídica Inmobiliaria y Notarial. Hosted on Vercel.

## Commands

- `npm run dev` — dev server on port 3000
- `npm run build` — lint + typecheck + SSG build (36 routes). This is the only verification step (no test framework exists).
- `npm run start` — production server

## Architecture

- All routes under `/[locale]` with `localePrefix: 'always'` (next-intl). Default: `es`. Languages: `es`, `en`.
- Tailwind v4 — no `tailwind.config.*`. Theme in `src/app/globals.css` via `@import "tailwindcss"` + `@theme` block.
- Blog: markdown files in `src/content/{es,en}/` with gray-matter frontmatter (title, description, date, category, author). Read at build time via `src/lib/blog.ts`.
- Forms POST to `/api/{contact,poderes,asesoria}` → Telegram + email (SMTP) in parallel + n8n (future, silently skipped if `NEXT_PUBLIC_N8N_WEBHOOK_BASE` unset). WhatsApp personal: on submit the form also opens `wa.me` with the message prefilled (client-side, via `src/lib/whatsapp.ts`).
- Sitemap: `src/app/sitemap.ts` — includes static pages, landings and blog posts (via `src/lib/blog.ts`), using `SITE_URL` from `src/lib/site.ts`. 44 URLs (17 static pages × 2 locales + 10 blog posts). Submit at Search Console → Sitemaps.
- SEO: metadata (canonical + hreflang `alternates`, OG image, Twitter card) via `buildAlternates()` and `OG_IMAGE_URL` from `src/lib/site.ts`. JSON-LD structured data rendered with `<JsonLd>` component (LegalService global, BlogPosting, Service). Full rationale in `README.md` §SEO.
- Body scroll locked on mobile menu open (`useEffect` toggles `document.body.style.overflow`).
- `<Analytics />` from `@vercel/analytics/next` must be added to layout. Package already in deps.

## Marketplace de Inmuebles (Supabase)

- **Stack:** Supabase (Postgres + Storage + Auth). Setup DDL en `supabase-setup.sql` (tablas `properties` / `property_images`, RLS solo lectura pública de `approved`, bucket público `inmuebles` límite 5 MB). Ejecutar una vez en SQL Editor; los 3 usuarios admin se crean manualmente en Authentication (email/password).
- **Seguridad:** TODAS las escrituras pasan por rutas API con la service-role key (`src/lib/supabase/admin.ts`); el anon key nunca escribe. Sin tabla `admins`: un usuario es admin si su email de sesión está en `ADMIN_EMAILS` (env, coma-separada). Guard doble: middleware (`/es|en/admin/*` → login si no sesión+admin) y `requireAdminApi()` en cada ruta `/api/admin/*`.
- **Flujo cliente:** `/inmuebles/publicar` (`PropertySubmissionForm`) → POST `/api/inmuebles/solicitud` (JSON metadata, rate-limit 5/h) crea fila `pending source=client` → sube fotos una a una a POST `/api/inmuebles/solicitud/[id]/foto` (máx 15, 40/h). Fotos se convierten a WebP client-side (`src/lib/image-webp.ts`, OffscreenCanvas máx 1600 px q0.8) para esquivar el límite de body de 4.5 MB de Vercel. Notificación Telegram+email vía `src/lib/property-notify.ts`.
- **Purga:** Vercel Cron diario (`vercel.json`) llama GET `/api/cron/cleanup-pending` con header `Authorization: Bearer CRON_SECRET`; elimina solicitudes `pending|rejected` >30 días (fotos del bucket primero, luego fila cascade) y avisa por Telegram.
- **Admin:** `/[locale]/admin/login` (client, `signInWithPassword`) y panel bajo route group `admin/(guarded)/` — lista con tabs por estado (`?estado=pending|approved|rejected`), aprobar/rechazar/eliminar inline (`AdminRowActions`), editor completo con gestión de fotos (subir/borrar/reordenar/portada, `PropertyEditor`) en `/admin/inmuebles/[id]` y creación en `/admin/inmuebles/nuevo`. Layout protegido cierra sesión y redirige.
- **Público:** listado `/inmuebles` con filtros por operación/tipo (query params, ISR 60s), detalle `/inmuebles/[id]` (galería lightbox + `LeadForm` → `/api/asesoria` con topic = título #id), JSON-LD `ItemList`/`Product`. Sitemap async incluye IDs aprobados (fail-safe sin Supabase).
- **next.config.mjs** tiene `images.remotePatterns` para `*.supabase.co` (storage público).

## SEO (rationale)

- **Single source of truth** — `src/lib/site.ts` exports `SITE_URL` (env `NEXT_PUBLIC_SITE_URL`, fallback `https://ajinabogados.online`), `SITE_NAME`, `SITE_TAGLINE`, `OG_IMAGE_URL` (`/images/og-image.png`, 1200×630) and `buildAlternates(locale, path)`. Change the domain in one place only.
- **Canonical + hreflang** — every page sets `alternates: buildAlternates(...)` in `generateMetadata` so Google merges ranking across `/es/*` and `/en/*` instead of treating them as duplicates. `metadataBase` in layout resolves relative URLs.
- **Open Graph / Twitter** — layout + pages emit `og:title`, `og:description`, `og:image` (1200×630 brand image, generated with PIL) and `twitter:card = summary_large_image` so shared links render as rich cards (WhatsApp, Facebook, X).
- **JSON-LD structured data** — `<JsonLd data={...}>` component (in `src/components/ui/JsonLd.tsx`) renders `application/ld+json` for rich results: `LegalService` (global, in layout: real address Chía, phone, geo, openingHours, areaServed), `Service` (`servicios/[slug]`), `Blog` (blog list) and `BlogPosting` (each post: headline, description, datePublished, author, publisher, image, mainEntityOfPage).
- **Google site verification** — layout emits `<meta name="google-site-verification">` only when `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is set. The property is currently verified via the **Domain method (DNS TXT record in Alibaba Cloud)** so the meta tag is NOT required — it only matters if the property is ever reverted to the HTML-tag method.
- **Sitemap + robots** — `src/app/sitemap.ts` (44 URLs) and `src/app/robots.ts` (`disallow: /api/, /_next/`, `sitemap: SITE_URL/sitemap.xml`), both keyed off `SITE_URL`.

## Env Vars (`.env.local`, gitignored)

```
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_CHAT_ID=<chat_id>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<gmail de asesoría>
SMTP_PASS=<app password 16 chars, requiere 2FA en Google>
SMTP_TO=<destinatario, normalmente el mismo SMTP_USER>
NEXT_PUBLIC_SITE_URL=https://ajinabogados.online   # dominio real; fallback en src/lib/site.ts
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=              # NO NECESARIA — propiedad verificada por método Dominio (DNS TXT en Alibaba Cloud). Solo si se revierte a método meta tag.
NEXT_PUBLIC_N8N_WEBHOOK_BASE=   # optional, future
SUPABASE_URL=https://<project-ref>.supabase.co        # SIN prefijo NEXT_PUBLIC_ (permite Sensitive en Vercel); valor real en .env.local / Vercel
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — NUNCA exponer al cliente>
ADMIN_EMAILS=<emails admin coma-separados>
CRON_SECRET=<secreto del cron de limpieza>
```

Set in Vercel dashboard for production (todas las de Supabase + ADMIN_EMAILS + CRON_SECRET también).

## Key Conventions

- All user-facing text in `src/i18n/messages/{es,en}.json`. Service items via `services.{id}.items.{i}`, landing pages via `landing.{key}.*`.
- Components use `cn()` from `@/lib/utils` (simple filter+join, not clsx).
- Layout helpers: `container-ajin` (max-w-7xl centered), `section-padding` (responsive padding).
- **Brand (Classic Premium 60-30-10):** `bg-ajin-primary` (#1B2A4A navy) = 30% structure; `bg-ajin-accent` (#C9A84C gold) = 10% CTAs/accents; `bg-ajin-bg` (#FAF7F2 marfil) = 60% backgrounds. Static colors, no dark/light toggle.
- Typography: headings = `Playfair Display` (serif, 600+), body = `Inter` (sans-serif, 400+).
- `Logo` component in `@/components/ui/Logo` — use `<Logo />` for light bg, `<Logo dark />` for navy/primary backgrounds.
- No test framework. No CI configured.
- Use `Link` from `@/i18n/navigation` (wraps next-intl) — not `next/link`. Use `usePathname` from same module.
