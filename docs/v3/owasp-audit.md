# OWASP Top 10 — Schneller Code-Audit (G6)

**Auditor:** James Park
**Datum:** 2026-04-10
**Scope:** Code-Review, keine Live-Penetration-Tests

| # | Kategorie | Status | Kommentar |
|---|---|---|---|
| A01 | Broken Access Control | **OK** | 3-Layer Defense (Proxy → withAuth → verifySuperAdmin). Alle company-scoped Actions filtern `company_id`. Siehe `rbac-matrix.md`. |
| A02 | Cryptographic Failures | **OK** | Secrets in Env (`STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `SENTRY_AUTH_TOKEN`, Supabase Service-Role). HTTPS via Vercel. Keine Passwort-Hashes im Code (Supabase Auth). |
| A03 | Injection | **OK** | Supabase Query-Builder überall (parameterisiert). Zod-Schemas auf allen Form-Inputs (`admin.ts`, `auth.ts`, `onboarding.ts`, `settings.ts`, `employees.ts`, etc.). Keine String-Concat für SQL gefunden. |
| A04 | Insecure Design | **FINDING** | Kein Rate-Limit auf `/login`, `/register`, `/reset-password`. Supabase Auth bietet eigene Throttles, aber keine App-Level-Limits. → V1.1 Backlog (nicht blocker, Supabase hat Brute-Force-Schutz). |
| A05 | Security Misconfiguration | **OK** | `vercel.json` setzt X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy. `next.config.ts` hat `poweredByHeader: false`. **Finding A5.1:** Keine `Strict-Transport-Security` und keine `Content-Security-Policy` in `vercel.json` — V1.1. |
| A06 | Vulnerable Components | **FINDING (HIGH)** | `npm audit` meldet **1 High**: `next 16.0.0-beta.0 - 16.2.2` — DoS via Server Components (GHSA-q4gf-8mx6-v5v3). Fix: `npm install next@16.2.3`. **BLOCKER — muss vor Launch gefixt werden.** |
| A07 | Authentication Failures | **OK** | Proxy erzwingt Auth vor Profile-Load (Zeile 99). Fail-closed bei Profile-Load-Fehler (Redirect zu Login mit Fehler-Code, **kein** Fallback auf `worker`). Zwei-Faktor aktuell nicht implementiert → V1.1. |
| A08 | Data Integrity | **OK** | Stripe-Webhook verifiziert Signatures via `constructEvent` (`stripe/route.ts:18`). Idempotenz-Checks für `checkout.session.completed`, `subscription.updated`, `subscription.deleted`, `payment_failed`. Cron nutzt `Bearer ${CRON_SECRET}`. |
| A09 | Logging / Monitoring | **OK** | `trackError()` in allen kritischen Actions. Sentry aktiv (jetzt **DSGVO-consent-gekoppelt**, siehe `instrumentation-client.ts`). Activity-Log fehlt explizit für einige Mutations — V1.1. |
| A10 | SSRF | **OK** | `fetch()` nur intern (`/api/auth/me`) — keine user-kontrollierten URLs. `next.config.ts` `remotePatterns` ist auf `*.supabase.co` begrenzt, keine Wildcard-Hosts. |

---

## Kritische Findings (Zusammenfassung)

### F1 (BLOCKER) — Next.js 16.2.2 DoS
- **CVE:** GHSA-q4gf-8mx6-v5v3
- **Severity:** High
- **Action:** `npm install next@16.2.3` + Redeploy vor Launch
- **Owner:** Mikail / Main-Session (nicht im QA-Scope, da > 15 Zeilen-Regel greift nicht, aber Version-Bump hat build-Impact)

### F2 (V1.1) — Keine CSP / HSTS Header
- `vercel.json` sollte `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` setzen
- CSP ist wegen Next.js + Supabase Storage nicht trivial — separate Sprint
- Nicht blocker für Launch

### F3 (V1.1) — Kein App-Level Rate Limit auf Login/Register
- Supabase Auth hat eingebaute Throttles (5 req/s pro IP), deshalb kein Blocker
- Upstash-basiertes Rate-Limit als V1.1 einplanen
