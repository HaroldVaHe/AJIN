# AJIN — Asesoría Jurídica Inmobiliaria y Notarial

Sitio web corporativo bilingüe (ES/EN) para una firma de abogados colombiana especializada en derecho inmobiliario, notarial, familia y corporativo.

## Stack

- Next.js 15.5.18 + React 19
- Tailwind CSS 4 + @tailwindcss/typography
- next-intl (i18n)
- react-hook-form
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
npm run build   # lint + typecheck + SSG (36 rutas estáticas, sitemap 44 URLs)
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

## SEO

El sitio implementa SEO técnico completo con una única fuente de verdad (`src/lib/site.ts`): `SITE_URL` (env `NEXT_PUBLIC_SITE_URL`, fallback `https://ajinabogados.online`), `SITE_NAME`, `OG_IMAGE_URL` y `buildAlternates()`. Para cambiar el dominio solo se toca una variable.

| Pieza | Por qué / qué hace |
|---|---|
| **Canonical + hreflang** (`buildAlternates`) | Cada página declara su canonical y sus alternates `/es` y `/en`. Evita contenido duplicado: Google fusiona el ranking de las versiones en vez de repartirlo. |
| **Open Graph / Twitter card** | `og:title`, `og:description`, `og:image` (1200×630, `public/images/og-image.png`, generada con PIL) y `twitter:card=summary_large_image`. Al compartir en WhatsApp/Facebook/X se muestra tarjeta con la imagen de marca. |
| **JSON-LD structured data** (`<JsonLd>`) | Datos legibles por máquina para *rich results*: `LegalService` (global: dirección real en Chía, teléfono, geolocalización, horario), `Service` (cada servicio), `Blog` y `BlogPosting` (fecha, autor, publisher, `mainEntityOfPage`). |
| **Google site verification** | Search Console verificado por **método Dominio (registro DNS TXT en Alibaba Cloud)** — permanente y no requiere el meta tag. El layout emite `<meta name="google-site-verification">` solo si `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` está definida (por si se revierte al método HTML). |
| **Sitemap + robots** (`sitemap.ts`, `robots.ts`) | Sitemap con 44 URLs (17 páginas estáticas × 2 idiomas + 10 posts del blog) y `robots.txt` con `disallow: /api/, /_next/`. Enviar en Search Console → Sitemaps. |

### English

The site ships complete technical SEO with a single source of truth (`src/lib/site.ts`): `SITE_URL` (env `NEXT_PUBLIC_SITE_URL`, fallback `https://ajinabogados.online`), `SITE_NAME`, `OG_IMAGE_URL` and `buildAlternates()`. Changing the domain is a one-variable edit.

| Piece | Why / what it does |
|---|---|
| **Canonical + hreflang** (`buildAlternates`) | Every page declares its canonical URL and its `/es` and `/en` alternates. Prevents duplicate content: Google merges ranking across locales instead of splitting it. |
| **Open Graph / Twitter card** | `og:title`, `og:description`, `og:image` (1200×630, `public/images/og-image.png`, generated with PIL) and `twitter:card=summary_large_image`. Links shared on WhatsApp/Facebook/X render as rich cards with the brand image. |
| **JSON-LD structured data** (`<JsonLd>`) | Machine-readable data for rich results: `LegalService` (global: real address in Chía, phone, geo, opening hours), `Service` (each service), `Blog` and `BlogPosting` (date, author, publisher, `mainEntityOfPage`). |
| **Google site verification** | Search Console is verified via the **Domain method (DNS TXT record in Alibaba Cloud)** — permanent and no meta tag needed. The layout only emits `<meta name="google-site-verification">` if `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is set (in case it reverts to the HTML-tag method). |
| **Sitemap + robots** (`sitemap.ts`, `robots.ts`) | Sitemap with 44 URLs (17 static pages × 2 locales + 10 blog posts) and `robots.txt` with `disallow: /api/, /_next/`. Submit at Search Console → Sitemaps. |
