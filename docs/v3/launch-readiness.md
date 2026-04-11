# v3 Launch-Readiness Report (G6)

**Auditoren:** James Park (QA & Reliability) · David Mueller (Technical Architect)
**Datum:** 2026-04-10
**Branch:** `v3-rebuild`
**Ziel:** Merge `v3-rebuild → main`, Live-Schaltung auf Production-Domain.

---

## 1. Executive Summary

v3 ist **approved with conditions**. Die Architektur sitzt, RBAC ist sauber dreilagig verriegelt, alle Server Actions laufen durch `withAuth`, Stripe-Webhook ist signatur-verifiziert + idempotent, DSGVO-Consent ist jetzt Sentry-gekoppelt. **Ein einziger externer Blocker bleibt:** Next.js 16.2.2 hat einen High-Severity DoS (GHSA-q4gf-8mx6-v5v3), Fix ist ein Patch-Bump auf 16.2.3. Wenn dieser Bump durch ist und Mikails Secrets gestellt sind, ist v3 Launch-ready.

---

## 2. Go/No-Go Kriterien

| # | Kriterium | Status |
|---|---|---|
| 1 | `npx tsc --noEmit` grün | ✅ EXIT=0 |
| 2 | Alle Server Actions auth-gated | ✅ (withAuth / verifySuperAdmin / requireCompanyAuth) |
| 3 | RBAC Matrix auditiert | ✅ `rbac-matrix.md` |
| 4 | OWASP Top 10 auditiert | ✅ `owasp-audit.md` |
| 5 | Stripe-Webhook signatur-verifiziert | ✅ `app/api/webhooks/stripe/route.ts:18` |
| 6 | Cron mit Secret geschützt | ✅ `app/api/cron/backup/route.ts:6` |
| 7 | DSGVO-Cookie-Consent aktiv | ✅ `components/shared/cookie-banner.tsx` |
| 8 | **Sentry an Analytics-Consent gekoppelt** | ✅ NEU in `instrumentation-client.ts` (G6) |
| 9 | Security-Headers (X-Frame, nosniff, Referrer-Policy) | ✅ `vercel.json` |
| 10 | `poweredByHeader: false` | ✅ `next.config.ts` |
| 11 | Nav-Config: keine toten Module | ✅ `lager` disabled-Flag entfernt (G6) |
| 12 | npm audit clean | ❌ 1 High (Next.js DoS) |
| 13 | Alle Env-Vars dokumentiert + in Vercel gesetzt | ⚠️ siehe §8 |
| 14 | Production-Domain konfiguriert | ⚠️ Mikail-Entscheidung ausstehend |

---

## 3. Offene Blocker

| # | Severity | Finding | Owner |
|---|---|---|---|
| B1 | **HIGH** | Next.js 16.2.2 → DoS via Server Components (GHSA-q4gf-8mx6-v5v3). Bump auf 16.2.3 erforderlich. | Main-Session (Mikail) |
| B2 | HIGH | `RESEND_API_KEY` nicht gesetzt → Einladungs-Mails gehen still ins Nichts | Mikail |
| B3 | HIGH | Stripe Live-Keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Price-IDs) nicht in Production-Env | Mikail |
| B4 | MEDIUM | Berufshaftpflicht-Nachweis für v1.0-Launch | Mikail (legal) |
| B5 | MEDIUM | Production-Domain-Entscheidung (nomadworks.de vs. nomadworks.app) | Mikail |

---

## 4. Offene Nicht-Blocker (V1.1-Backlog)

| # | Item | Quelle |
|---|---|---|
| V1 | Upstash-basiertes Rate-Limit für `/login`, `/register`, `/reset-password` | OWASP A04 |
| V2 | HSTS-Header + CSP in `vercel.json` | OWASP A05 |
| V3 | 2FA für owner-Accounts | OWASP A07 |
| V4 | Activity-Log für alle Mutations (aktuell nur Dashboard-Feed) | OWASP A09 |
| V5 | Proxy-Onboarding-Redirect Performance (verschachtelte Profile→Company-Query) | RBAC R3 |
| V6 | `any` + `AnyRow` + `@ts-ignore` Restbestand (55 Vorkommen in 11 Dateien) — typen nachziehen | TS-Audit |
| V7 | Load-Tests / k6-Script | G6 skipped |
| V8 | E2E-Test-Suite (Playwright) für kritische Flows | G6 skipped |
| V9 | Sentry-Runtime-Reinit bei nachträglichem Opt-in (aktuell: Page-Reload nötig) | Sentry-Consent-Fix |
| V10 | `proxy.ts` `isWritePath()` durch autoritative Action-Whitelist ersetzen | RBAC R2/R7 |

### `any` / `AnyRow` Hotspots

```
app/(admin)/admin/firmen/[id]/page.tsx:3
lib/actions/invoices.ts:24
lib/actions/tips.ts:3
lib/actions/fleet.ts:1
lib/actions/subcontractors.ts:1
lib/actions/soka.ts:11
lib/actions/profile.ts:2
lib/actions/settings.ts:3
lib/actions/onboarding.ts:3
app/(app)/firma/soka-export/drucken/page.tsx:2
components/modules/onboarding/onboarding-wizard.tsx:2
```
Gesamt: 55 Vorkommen, keine sicherheitskritisch. V1.1.

---

## 5. RBAC-Findings

Siehe `docs/v3/rbac-matrix.md`. Kurzfassung:

- **392 Kombinationen** (7 Rollen × 14 Module × 4 Actions) geprüft.
- **Keine Lücke** gefunden, bei der eine Rolle Zugriff auf Ressourcen hätte, die ihr nicht zustehen.
- **R6 gefixt:** `navigation.ts` — `lager` `disabled`-Flag entfernt (Modul ist in v3 portiert und aktiv).
- R1 (clockIn ohne Modul-Check), R2 (isWritePath-Heuristik), R3 (Proxy-Onboarding-Perf), R7 (Write-Erkennung) sind NOTED — kein Blocker.

---

## 6. Security-Findings

Siehe `docs/v3/owasp-audit.md`.

- **A01–A03, A07, A08, A09, A10:** OK.
- **A04 (Rate-Limit):** Finding → V1.1 (Supabase hat eingebaute Throttles, kein Blocker).
- **A05 (Headers):** OK für Basics. HSTS/CSP → V1.1.
- **A06 (Vulnerable Components):** **BLOCKER B1** — Next.js 16.2.2 DoS.

---

## 7. Performance-Annahmen (Architektur-Check)

- Keine Load-Tests in G6. Architektur-Review:
  - Supabase-Queries sind mit `.select('spezifische Felder')` sparsam gehalten.
  - `withAuth` macht 1 Profile-Read pro Action — akzeptabel (Middleware-Cache Supabase-seitig).
  - Proxy macht 1 auth.getUser + 1 profile read pro Request (kein Caching) — für MVP OK, für Skalierung → V1.1.
  - `getAllUsers` (admin) lädt bis zu 1000 Nutzer in Memory → OK bis 1000 Firmen, dann Pagination.

---

## 8. Was Mikail vor Launch liefern muss

| # | Item | Wo |
|---|---|---|
| M1 | `RESEND_API_KEY` | Vercel Env (Production) |
| M2 | `STRIPE_SECRET_KEY` (live) | Vercel Env |
| M3 | `STRIPE_WEBHOOK_SECRET` (live, nach Endpoint-Registrierung in Stripe Dashboard) | Vercel Env |
| M4 | Stripe Price-IDs für starter/business/enterprise (live) | Vercel Env (z. B. `STRIPE_PRICE_STARTER` etc.) |
| M5 | `CRON_SECRET` (Production) | Vercel Env |
| M6 | `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` | Vercel Env |
| M7 | `NEXT_PUBLIC_SENTRY_DSN` | Vercel Env |
| M8 | `NEXT_PUBLIC_APP_URL` → Production-URL | Vercel Env |
| M9 | Berufshaftpflicht-Versicherung (Beleg für ToS-Seite) | Impressum |
| M10 | Domain-Entscheidung + DNS-Records (Vercel → Domain) | Vercel Project |
| M11 | Stripe-Webhook-Endpoint in Stripe Dashboard registrieren: `https://<domain>/api/webhooks/stripe` | Stripe |
| M12 | Next.js Bump auf **16.2.3** (Blocker B1) | `package.json` |

---

## 9. Launch-Empfehlung

**James Park (QA & Reliability):**
> Approved **with conditions**. Der Code ist sauber, die Enforcement-Architektur hält. Ich blockiere auf B1 (Next.js CVE) und B2–B3 (Stripe/Resend Live-Keys). Der Rest ist V1.1-Arbeit — kein Grund den Launch aufzuschieben, sobald die Blocker weg sind.

**David Mueller (Technical Architect):**
> Approved **with conditions**. Die Architektur-Entscheidungen (3-Layer Auth, Admin-Client-only-in-Server-Actions, Proxy als erste Linie, `withAuth` als zweite) sind reversibel genug, dass wir im V1.1-Fenster ohne Schmerz nachziehen können. Transparency over comfort: der `AnyRow`-Restbestand ist echt, aber kein Launch-Risiko. Merge zu main sobald B1 durch ist.

**Merge-Empfehlung:** Sobald B1 (Next.js-Bump) und M1–M8 (Env-Vars) erledigt sind → **Merge `v3-rebuild → main` ohne weitere QA-Runde**. Der Code-Stand selbst ist stabil.

---

## 10. Rollback-Plan

Wenn's nach Launch knallt:

1. **Sofort-Rollback (Vercel):** `vercel rollback` auf den letzten `main`-v2-Deploy. Zeit: < 60 Sekunden.
2. **DB-Rollback:** Keine v3-exklusiven Migrationen identifiziert, die v2 brechen würden. (Schema ist v2-kompatibel.)
3. **Monitoring-Window:** 72 Stunden Sentry-Alerts auf Severity=error eng beobachten. Mikail + James on-call.
4. **Hotfix-Branch:** `v3-hotfix` von main abzweigen, kleine Fixes, direkter Merge → main.
5. **Kommunikation:** Status-Seite auf `/status` (existiert?) oder Banner via `components/shared/` Einblendung.

### Rollback-Trigger (harte Kriterien)

- >5 % der Logins schlagen fehl (Sentry-Rate)
- Stripe-Webhook-Error-Rate > 1 %
- Proxy wirft DB-Timeouts auf mehr als 0.5 % der Requests
- Kritischer RBAC-Bypass (Rolle sieht fremde Daten)

---

## Sign-Off

- James Park (QA & Reliability): ✍️ **approved with conditions** (B1 + M1–M8)
- David Mueller (Technical Architect): ✍️ **approved with conditions** (B1 + M1–M8)
- Mikail (Product Owner): ⏳ pending
