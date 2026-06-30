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
- Forms POST to `/api/{contact,poderes,asesoria}` → Telegram (primary) + n8n (future, silently skipped if `NEXT_PUBLIC_N8N_WEBHOOK_BASE` unset).
- Sitemap: manually maintained in `src/app/sitemap.ts`.
- Body scroll locked on mobile menu open (`useEffect` toggles `document.body.style.overflow`).
- `<Analytics />` from `@vercel/analytics/next` must be added to layout. Package already in deps.

## Env Vars (`.env.local`, gitignored)

```
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_CHAT_ID=<chat_id>
NEXT_PUBLIC_N8N_WEBHOOK_BASE=   # optional, future
```

Set in Vercel dashboard for production.

## Key Conventions

- All user-facing text in `src/i18n/messages/{es,en}.json`. Service items via `services.{id}.items.{i}`, landing pages via `landing.{key}.*`.
- Components use `cn()` from `@/lib/utils` (simple filter+join, not clsx).
- Layout helpers: `container-ajin` (max-w-7xl centered), `section-padding` (responsive padding).
- **Brand (Classic Premium 60-30-10):** `bg-ajin-primary` (#1B2A4A navy) = 30% structure; `bg-ajin-accent` (#C9A84C gold) = 10% CTAs/accents; `bg-ajin-bg` (#FAF7F2 marfil) = 60% backgrounds. Static colors, no dark/light toggle.
- Typography: headings = `Playfair Display` (serif, 600+), body = `Inter` (sans-serif, 400+).
- `Logo` component in `@/components/ui/Logo` — use `<Logo />` for light bg, `<Logo dark />` for navy/primary backgrounds.
- No test framework. No CI configured.
- Use `Link` from `@/i18n/navigation` (wraps next-intl) — not `next/link`. Use `usePathname` from same module.
