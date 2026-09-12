# Atalho

URL shortener with click analytics. Paste a long address, get a short one (a random slug or an
alias you pick), share it or print its QR code, and see who opened it: clicks and unique visitors
per day, where they came from, which device, browser and language. No IP address is ever stored.

Leia em português: [README.pt-BR.md](README.pt-BR.md)

## Stack

- **Backend:** Node.js 22, TypeScript, Fastify 5, Prisma 6, PostgreSQL, Zod 4, `qrcode`
- **Frontend:** React 19, Vite, Tailwind CSS 4, TanStack Query, Recharts
- **Tests:** Vitest on both sides (the API against a real PostgreSQL database, the UI with Testing Library)

## Running it

You need Node.js 22.12+ and PostgreSQL running on `localhost:5432`.

```bash
cd backend
npm install
npm run dev        # http://localhost:3337, docs at /docs
```

```bash
cd frontend
npm install
npm run dev        # http://localhost:5177
```

The backend's `npm run dev` creates `.env` from `.env.example` (with a random JWT secret and visitor
salt), creates the database, applies the migrations and loads a demo account. The frontend proxies
`/api` to the backend, so there is nothing else to configure. If your Postgres user isn't
`postgres/postgres`, change `DATABASE_URL` in `backend/.env`.

**Demo account:** `demo@atalho.dev` / `atalho123`, with six links (one switched off, one expired)
and 60 days of clicks. Short links answer on the backend port: open
`http://localhost:3337/github` to follow one.

## What it does

- **Short links** with a random 7-character slug (no look-alike characters such as `0`/`O` or
  `1`/`l`) or a custom alias. Only `http` and `https` targets are accepted, a link can't point back
  to the shortener, and names the app uses (`api`, `docs`...) are reserved.
- **Redirect** at `GET /:slug` with a `302`. Unknown links answer `404` and switched-off or expired
  ones answer `410`, as a small HTML page for browsers and JSON for everything else.
- **Stats per link** for the last 7, 30 or 90 days: clicks and unique visitors per day, the change
  against the previous period of the same length, and rankings of referrers, devices, browsers and
  languages.
- **QR codes** as SVG or PNG. They encode the short address, so scans are counted and the target can
  change without reprinting anything.
- **Dashboard** to create, search, filter (active, switched off, expired), edit, switch off and
  delete links. Filters and the stats period live in the URL.
- **API docs** generated from the same Zod schemas that validate the routes, at `/docs`.

## Decisions worth mentioning

- **No IP is stored.** Each click keeps a hash of a secret salt, the day, the IP and the user agent.
  The same visitor gets the same hash on the same day, which is enough to count unique visitors,
  and a different one the next day. The trade-off: someone who comes back on two different days is
  counted on both.
- **Bots don't inflate the numbers.** Link previews (WhatsApp, Telegram, Slack...) and crawlers are
  detected by user agent, stored as `BOT` and left out of every total except "bots filtered".
- **Days follow São Paulo time, not UTC.** A click at 11:30 pm belongs to that day. The period limits
  are computed in PostgreSQL with `AT TIME ZONE` and compared against `clicked_at` directly, so the
  `(link_id, clicked_at)` index is used, and days without clicks come back as zero.
- **The redirect doesn't wait for the database.** The click is written after the `302` goes out, and
  the response is `no-store` so every visit reaches the API. If the process dies mid-write, that one
  click is lost; the visitor is never slowed down. `HEAD` requests (link checkers) aren't counted.
- **The slug never changes.** A short link may already be printed or shared, so editing covers the
  target, title, expiration and on/off switch only.
- **Uniqueness is left to the database.** A random slug is inserted and retried on a unique
  violation instead of checked first, which also holds when two requests race.
- **Deterministic demo data.** The seed uses a seeded random generator, so the demo shows the same
  numbers on every machine, and it never touches a link that already has clicks.
- **Charts use a palette validated for color vision deficiency**, a legend whenever there are two
  series, and a table version for screen readers. Status (active, switched off, expired) always
  comes with an icon and a word.
- Every query is scoped to the logged-in user; another person's link answers 404. Login, sign up and
  link creation have their own rate limits, and errors always come back as `{ error, message }`.

## Tests

```bash
cd backend && npm test     # 41 tests: auth, links, redirect, stats, QR codes, seed, docs, helpers
cd frontend && npm test    # 19 tests: login and sign up, links page, link stats, formatting
```

## Project structure

```
backend/
├── prisma/          schema, migrations and demo seed
├── scripts/         setup-db.ts, used by npm run dev
├── src/
│   ├── controllers/ one class per route, with handle()
│   ├── services/    business rules, one class per use case, with execute()
│   ├── routes/      route wiring (/api/* and the redirect at the root)
│   ├── schemas/     Zod schemas (validation and OpenAPI docs)
│   └── utils/       slugs, click context, visitor hash, time zone, target checks
└── tests/
frontend/
└── src/
    ├── pages/       one page per route, each with its tests
    ├── components/  links, stats charts and UI pieces
    └── lib/         API client, formatting, labels, theme colors
```

Code comments are in Portuguese.
