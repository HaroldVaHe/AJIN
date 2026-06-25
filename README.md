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
npm run build   # lint + typecheck + SSG (36 rutas estáticas)
```

## Despliegue

Conectado al repo de GitHub en Vercel. Las variables de entorno se configuran en el dashboard de Vercel. El dominio se gestiona desde Vercel.

## Estructura

```
src/
├── app/[locale]/     # Rutas Next.js (i18n)
├── components/       # UI y secciones
├── content/{es,en}/  # Blog en Markdown
├── data/             # Config de servicios y landing pages
├── i18n/             # Traducciones y routing
└── lib/              # Utilidades (blog, Telegram, helpers)
```

## Formularios

Los envíos de formularios (`/contacto`, `/poderes`) se envían a Telegram y opcionalmente a n8n (futuro). Ver `.env.example`.
