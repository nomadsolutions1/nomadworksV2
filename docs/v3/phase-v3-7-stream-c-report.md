# Phase V3-7 Stream C — DevOps-Finalisierung (Alex Nowak)

**Datum:** 2026-04-10
**Branch:** `v3-rebuild`
**Stream:** C — Env-Vars, Vercel-Config, Sentry, Monitoring

## Zusammenfassung

- Env-Vars auf Vercel Production sind nahezu vollstaendig; einziger offener Blocker ist **`RESEND_API_KEY`** (benoetigt von Lena's Email-Stream, noch ohne Wert).
- `vercel.json` um **Security-Headers** erweitert (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). HSTS wird von Vercel automatisch gesetzt.
- `next.config.ts`: `poweredByHeader: false`, `reactStrictMode: true`, zusaetzlicher `*.supabase.co` remotePattern. Sentry-Integration (`withSentryConfig`) war bereits korrekt.
- Sentry-Sample-Rates auf Production-sichere Werte (0.1 / 0.01) reduziert — vorher war 1.0 / 0.1 (Kostenrisiko).
- Ops-Runbook neu angelegt: `docs/v3/ops-runbook.md`.
- **TypeScript:** `npx tsc --noEmit` gruen.
- Keine Commits/Pushes/Deploys — Main-Session committed.

## Block 1 — Env-Vars Gap-Analyse

### Production-Stand (via `vercel env ls production`)

| Key | Prod | In `.env.local` | Im Code verwendet |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | YES | YES | YES |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | YES | YES |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | YES | YES |
| `STRIPE_SECRET_KEY` | YES | YES | YES |
| `STRIPE_WEBHOOK_SECRET` | YES | YES | YES |
| `STRIPE_PRICE_STARTER` | YES | YES | YES |
| `STRIPE_PRICE_BUSINESS` | YES | YES | YES |
| `STRIPE_PRICE_ENTERPRISE` | YES | YES | YES |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | YES | YES | YES |
| `NEXT_PUBLIC_SENTRY_DSN` | YES | YES | YES |
| `SENTRY_AUTH_TOKEN` | YES | YES | YES (Build) |
| `SENTRY_ORG` | **YES** | **NO** | YES (Build) |
| `SENTRY_PROJECT` | **YES** | **NO** | YES (Build) |
| `NEXT_PUBLIC_APP_URL` | YES (Prod-URL) | localhost | YES |
| `CRON_SECRET` | YES | YES | YES |
| `RESEND_API_KEY` | **NO** | leer | (noch nicht, kommt via Lena) |

### Code-Scan (`process.env.*`)

Alle tatsaechlich im Code genutzten Keys sind in Production gesetzt. Kein Gap zwischen Code und Prod-Envs. Im Code referenziert:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
- App: `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`
- Sentry: `NEXT_PUBLIC_SENTRY_DSN` (runtime), `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (Build / Source-Maps-Upload)
- Next Runtime: `NEXT_RUNTIME`, `NODE_ENV`

### David's Finding — aktueller Stand

> `SENTRY_ORG` und `SENTRY_PROJECT` fehlen in `.env.local`

**Bestaetigt:** Beide fehlen weiterhin lokal, sind aber in Production gesetzt. Impact:

- Prod-Build auf Vercel: OK — Source-Maps-Upload funktioniert.
- Lokaler `next build`: Source-Maps werden still uebersprungen (nicht kritisch).
- `.env.local.example` listet beide korrekt als Platzhalter — keine Aenderung noetig.

Empfehlung an Mikail: bei Gelegenheit lokal in `.env.local` eintragen (Werte aus dem Vercel-Dashboard kopieren). Nicht Launch-blockierend.

### Neu hochgeladen

**Keine.** Der einzige Kandidat (`RESEND_API_KEY`) hat lokal keinen Wert. Upload eines leeren Strings wuerde Lena's Email-Versand silent fail machen. Als offenen Punkt fuer Mikail markiert (siehe unten).

## Block 2 — Config-Aenderungen

### `vercel.json`

Hinzugefuegt: `headers`-Block mit

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

Crons (`/api/cron/backup` `0 3 * * *`) und `framework: nextjs` unveraendert. HSTS bewusst nicht manuell — Vercel setzt es automatisch.

### `next.config.ts`

- `poweredByHeader: false` (Security: entfernt `x-powered-by: Next.js`-Header)
- `reactStrictMode: true`
- `images.remotePatterns`: zusaetzliches Wildcard-Pattern `*.supabase.co` (falls kuenftig ein anderer Supabase-Project-Host genutzt wird)
- `withSentryConfig`-Wrapper unveraendert — war bereits korrekt mit `org`, `project`, `authToken`, `silent: true`, `webpack.treeshake.removeDebugLogging: true`

Turbopack-Kompatibilitaet: keine neuen Webpack-Config-Optionen hinzugefuegt. Die `webpack.treeshake`-Option stammt aus `withSentryConfig` selbst und ist Sentry-intern (nicht Next-Webpack-Config).

### `sentry.client.config.ts`

- `tracesSampleRate`: 1.0 -> **0.1** (10%)
- `replaysSessionSampleRate`: 0.1 -> **0.01** (1%)
- `replaysOnErrorSampleRate`: 1.0 (unveraendert — wir wollen 100% bei Fehlern)
- `environment: process.env.NODE_ENV` ergaenzt
- `enabled: process.env.NODE_ENV === "production"` unveraendert

### `sentry.server.config.ts` + `sentry.edge.config.ts`

- `tracesSampleRate`: 1.0 -> **0.1**
- `environment: process.env.NODE_ENV` ergaenzt
- `enabled`-Gate unveraendert

### `instrumentation.ts` + `instrumentation-client.ts`

Beide bereits korrekt und Sentry-v10-kompatibel — keine Aenderung.

- `instrumentation.ts` laedt `sentry.server.config` fuer `nodejs` und `sentry.edge.config` fuer `edge`, exportiert `onRequestError = captureRequestError`.
- `instrumentation-client.ts` importiert `sentry.client.config` und exportiert `onRouterTransitionStart`.

## Block 3 — Ops-Runbook

Neue Datei: `docs/v3/ops-runbook.md`. Enthaelt 10 Abschnitte: Deploy-Flow, Git-Reconnect-Klickpfad, Rollback, Env-Aenderungen, Logs, Sentry, Supabase-Backups, Cron-Health, Custom-Domain-Setup (inkl. DNS-Records), Monitoring-Checklist.

## Geaenderte/Neue Dateien

- `vercel.json` (Security Headers)
- `next.config.ts` (poweredBy, strict mode, wildcard remotePattern)
- `sentry.client.config.ts` (Sample-Rates)
- `sentry.server.config.ts` (Sample-Rate)
- `sentry.edge.config.ts` (Sample-Rate)
- `docs/v3/ops-runbook.md` (NEU)
- `docs/v3/phase-v3-7-stream-c-report.md` (dieses File, NEU)

## Verifikation

```bash
npx tsc --noEmit    # gruen, keine Fehler
```

## Offene Punkte fuer Mikail

1. **`RESEND_API_KEY` fuer Production besorgen** (Resend-Dashboard -> API Keys -> Create) und setzen:
   ```bash
   vercel env add RESEND_API_KEY production
   # Wert bei Prompt einfuegen
   ```
   Blockiert Email-Versand in Lena's Stream. **Launch-Blocker sobald Transactional Emails live gehen sollen.**

2. **GitHub<->Vercel Git-Integration reconnecten:**
   - https://vercel.com/nomad-solutions/nomadworks-v2/settings/git
   - Disconnect -> Connect with GitHub -> Repo `nomadsolutions1/nomadworksV2` -> Production-Branch `main`
   - Solange das kaputt ist, muss jeder Prod-Deploy manuell via `vercel deploy --prod --yes` laufen.

3. **`NEXT_PUBLIC_APP_URL` nach Custom-Domain-Setup aktualisieren** (siehe Runbook Abschnitt 9). Aktuell zeigt Prod auf die Vercel-URL.

4. **Custom Domain fuer Launch entscheiden** (z.B. `app.nomad-solutions.de`) und im Vercel-Dashboard adden — DNS-Schritte im Runbook Abschnitt 9.

5. **Stripe-Webhook-Endpoint** nach Custom-Domain-Wechsel im Stripe-Dashboard updaten.

6. **Lokal `SENTRY_ORG` + `SENTRY_PROJECT` in `.env.local` eintragen** (nicht Launch-blockierend, nur Dev-QoL fuer Source-Maps).

## Launch-Blocker (aktuell)

- Nur **`RESEND_API_KEY`** fehlt — sonst ist die DevOps-Seite launch-ready.
