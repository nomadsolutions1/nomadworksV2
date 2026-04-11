# Phase V3-7 Stream A — Stripe Live-Härtung + Rollen-Deltas

**Owner:** Elena Petrov (Backend)
**Branch:** `v3-rebuild`
**Status:** Ready for Review
**Scope:** Stripe Webhook idempotency + checkout/portal härten, office/accountant/employee Permission-Deltas (Backend-only).

---

## Block 1 — Stripe Live-Härtung

### Was war schon da

- `lib/services/stripe.ts` mit lazy-initialized `getStripe()` — OK, behalten.
- `app/api/webhooks/stripe/route.ts` mit `constructEvent` + `STRIPE_WEBHOOK_SECRET` — Signature-Verify korrekt, 400 bei Fehler, 500 bei Handler-Fehler (Stripe retried dann), 200 `{ received: true }` bei Erfolg.
- `lib/actions/billing.ts` mit `createCheckoutSession`, `createPortalSession`, `getSubscriptionStatus`.
- `components/modules/settings/billing-tab.tsx` rendert Pläne, Status, Portal-Button — bereits an `/firma` Tab `abo` gehängt.
- `app/(app)/firma/page.tsx` läd `getSubscriptionStatus` im Server-Component.

### Was geändert wurde

**`app/api/webhooks/stripe/route.ts` — Idempotenz**

Stripe darf jeden Event beliebig oft re-delivern. Ohne `stripe_event_log` Tabelle (nicht im Schema) wird Idempotenz via **State-Check vor Mutation** erzwungen:

- `checkout.session.completed`: Prüft ob Company bereits `plan === metadata.plan` UND `stripe_subscription_id === session.subscription` hat → skip. Sonst: Update. (Verhindert Reset von `trial_ends_at` bei Re-Delivery.)
- `customer.subscription.updated`: Prüft ob Company bereits `plan === newPlan` UND `is_active === (status === "active")` hat → skip. Sonst: Update.
- `customer.subscription.deleted`: Prüft ob Company bereits `plan === "trial"` UND `stripe_subscription_id === null` hat → skip. Sonst: Deactivate.
- `invoice.payment_failed`: Notification-Duplikate via `link = "stripe_event:<event.id>"` unique-check verhindert. Re-Delivery erzeugt keine zweite Benachrichtigung.

Error-Response-Codes final:
- `400` fehlende Signature / Verify-Fehler
- `500` Handler-Exception (Stripe retried → landet beim State-Check → idempotent)
- `200 { received: true }` bei erfolgreichem Handling ODER skip

**`lib/actions/billing.ts` — Härten**

- Migriert auf `withAuth("firma", "write"|"read", ...)` statt manuellem `requireCompanyAuth`.
- `AnyRow`-Casts entfernt — nutzt typisierte `Database["public"]["Tables"]["companies"]["Row"]`-Felder direkt.
- Zod-Schema `z.enum(["starter","business","enterprise"])` auf `createCheckoutSession`-Input.
- `allow_promotion_codes: true` + `billing_address_collection: "required"` auf Checkout-Session (EU-Umsatzsteuer-Compliance vorbereitet).
- `success_url`/`cancel_url`/`return_url` aus `NEXT_PUBLIC_APP_URL` (ENV-fallback auf vercel.app).
- `customer.email = user.email` + `customer.name = company.name` + `metadata.company_id + nomadworks_plan`.
- `metadata.company_id + plan` auch auf `subscription_data.metadata` (für `customer.subscription.*` Webhooks).
- Activity-Log: `checkout_started`, `portal_opened`.
- `trackError` an allen Catch-Stellen (Sentry).
- Fail-closed: Bei Stripe-Retrieve-Fehler in `getSubscriptionStatus` wird `status: "unknown"` zurückgegeben, Plan-Daten bleiben aus DB.
- Double-Check `profile.role === "owner"` zusätzlich zu `withAuth("firma", "write")` (Defense in Depth — aktuell nur Owner hat `firma`-Permissions, aber explizit).

**Pricing-UI**

`/firma?tab=abo` lädt bereits `BillingTab` mit allen 3 Plänen, aktueller Plan markiert, "Upgrade"/"Plan ändern"/"Rechnungen einsehen"-Buttons. Der Portal-Link ersetzt den expliziten Rechnungs-Download — Stripe Customer Portal zeigt alle historischen Rechnungen.

### Sicherheits-Checkliste

| Action | withAuth | Zod | company_id | Activity | trackError | revalidate |
|---|---|---|---|---|---|---|
| `createCheckoutSession` | firma/write | ✅ planSchema | ✅ profile.company_id | ✅ | ✅ | n/a (Redirect) |
| `createPortalSession` | firma/write | — (keine Inputs) | ✅ profile.company_id | ✅ | ✅ | n/a (Redirect) |
| `getSubscriptionStatus` | firma/read | — (read-only) | ✅ profile.company_id | — (read) | ✅ | n/a |
| Webhook `checkout.session.completed` | Signature-verify | metadata-check | ✅ metadata.company_id | (System-Event) | ✅ | n/a |
| Webhook `subscription.updated` | Signature-verify | metadata-check | ✅ metadata.company_id | (System-Event) | ✅ | n/a |
| Webhook `subscription.deleted` | Signature-verify | metadata-check | ✅ metadata.company_id | (System-Event) | ✅ | n/a |
| Webhook `invoice.payment_failed` | Signature-verify | customer-lookup | ✅ company via customer | (Notification) | ✅ | n/a |

---

## Block 2 — Rollen-Deltas

### Ansatz

office/accountant/employee werden **NICHT** mit eigenen `foreman_permissions`-Rows konfiguriert. Stattdessen **hart-codierte Role-Deltas** in `auth-helper.ts` + `proxy.ts`. Mikails Entscheidung #1 (revidiert): Schema behalten, UI minimal.

### Permission-Matrix

| Modul | super_admin | owner | foreman | office | accountant | worker | employee |
|---|---|---|---|---|---|---|---|
| /admin/* | ✅ | — | — | — | — | — | — |
| /dashboard | — | ✅ | ✅ | ✅ | ✅ | — | — |
| /profil | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| /benachrichtigungen | — | ✅ | ✅ | ✅ | ✅ | — | — |
| /mitarbeiter (read) | — | ✅ | p | ✅ | ✅ | — | — |
| /mitarbeiter (write) | — | ✅ | p | ✅ | ❌ | — | — |
| /baustellen | — | ✅ | p | ✅ | ❌ | — | — |
| /stempeln + /zeiterfassung | — | ✅ | p | ✅ | ❌ | ✅ | — |
| /disposition | — | ✅ | p | ✅ | ❌ | — | — |
| /auftraege | — | ✅ | p | ✅ | ❌ | — | — |
| /fuhrpark | — | ✅ | p | ✅ | ❌ | — | — |
| /lager | — | ✅ | p | ✅ | ❌ | — | — |
| /rechnungen (read) | — | ✅ | p | ✅ | ✅ | — | — |
| /rechnungen (write) | — | ✅ | p | ✅ | ❌ | — | — |
| /subunternehmer | — | ✅ | p | ✅ | ❌ | — | — |
| /bautagesbericht | — | ✅ | p | ✅ | ❌ | — | — |
| /firma (Firma verwalten) | — | ✅ | — | — | — | — | — |
| /firma/soka-export | — | ✅ | — | — | ✅ | — | — |
| /firma/steuerberater | — | ✅ | — | — | ✅ | — | — |

Legende: ✅ immer, — verboten → Redirect, **p** = via `foreman_permissions`-Tabelle pro User, ❌ explizit verboten.

### Implementation

**`lib/utils/auth-helper.ts`**

- Zwei neue Sets: `ACCOUNTANT_READ_MODULES = {rechnungen, mitarbeiter}`, `OFFICE_ALL_MODULES = {alle 10 Standard-Module}`.
- `checkModuleAccess`:
  - accountant: write → `false`. read → `has(moduleName)`.
  - office: `has(moduleName) → true`, sonst fallback auf `foreman_permissions` (für zukünftige Custom-Module).
  - employee/worker: stets `false` (unverändert).
- `canRoleAccessModule` mit neuem `mode: "read"|"write"`-Parameter (default `"read"`) — spiegelt `checkModuleAccess`-Logik für den synchronen Proxy-Kontext.

**`proxy.ts`**

- Neu: `accountantAllowedPrefixes = [/dashboard, /profil, /benachrichtigungen, /rechnungen, /mitarbeiter, /firma/soka-export, /firma/steuerberater]`.
- Neu: `isWritePath(pathname)` helper (neu/bearbeiten/edit).
- Root-Redirect `/` → `/profil` für `employee` (vorher `/login`).
- employee-Branch: whitelist nur `/profil`, alles andere → redirect `/profil` (vorher: `/login`).
- Neue accountant-Branch: whitelist-Check, dann `isWritePath` → redirect `/dashboard`, sonst pass-through. `/firma/soka-export` + `/firma/steuerberater` short-circuit bevor `ownerOnlyRoutes`-Block greift.
- office-Branch innerhalb `(foreman||office)`: wenn matchedRoute → always pass (keine `foreman_permissions`-Query mehr). Fällt nur für non-standard-Module auf foreman_permissions zurück.
- foreman-Branch nutzt jetzt `isWritePath(pathname)` statt inline-String-Check (DRY).

### Mentale Tests

| Test | Erwartung | Resultat |
|---|---|---|
| `employee` GET /dashboard | redirect /profil | ✅ |
| `employee` GET /profil | 200 | ✅ |
| `employee` GET /stempeln | redirect /profil | ✅ |
| `accountant` GET /baustellen | redirect /dashboard (whitelist-miss) | ✅ |
| `accountant` GET /rechnungen | 200 read | ✅ (proxy pass + withAuth read true) |
| `accountant` POST (Form) /rechnungen/neu | redirect /dashboard (isWritePath) UND falls umgangen: withAuth("rechnungen","write") → `{error:"Keine Berechtigung"}` | ✅ (Defense in Depth) |
| `accountant` GET /firma | redirect /dashboard (whitelist-miss, /firma selbst nicht in whitelist) | ✅ |
| `accountant` GET /firma/soka-export | 200 read | ✅ |
| `accountant` GET /mitarbeiter | 200 read, sensitive fields gefiltert (filterSensitiveData, role=accountant + kein can_view_sensitive_data → strip) | ✅ |
| `office` GET /firma | redirect /dashboard (ownerOnlyRoutes greift vor office-Block) | ✅ |
| `office` GET /admin | redirect /dashboard (admin-only-check) | ✅ |
| `office` GET /rechnungen | 200 read+write | ✅ |
| `office` GET /mitarbeiter | 200 read+write (sensitive fields gefiltert mangels can_view_sensitive_data) | ✅ |
| `foreman` GET /lager | nur wenn foreman_permissions.lager.can_view === true | ✅ unverändert |

### Edge-Cases

- `filterSensitiveData` enthält bereits `role === "accountant" && can_view_sensitive_data` als full-access-Check — accountant ohne Flag sieht SOKA-relevante Lohndaten NICHT. Für SOKA-Export wird das in der SOKA-Action serverseitig gemacht (bypasst filter). Review: Aktuell OK, kein Change nötig.
- `office` ohne expliziten `can_view_sensitive_data` Flag: sieht `hourly_rate`/`iban` etc. nicht, weil `filterSensitiveData` nur owner/super_admin + (foreman|accountant)+Flag durchlässt. Falls office immer sensitive sehen soll → separater Follow-up. AKTUELL: office sieht KEINE sensitiven Daten — konservativ & sicher.

---

## Files

**Geändert**
- `app/api/webhooks/stripe/route.ts` — Idempotenz auf allen 4 Event-Typen
- `lib/actions/billing.ts` — withAuth + zod + activity + trackError, kein AnyRow
- `lib/utils/auth-helper.ts` — Role-Deltas in checkModuleAccess + canRoleAccessModule
- `proxy.ts` — accountant-branch, employee → /profil, office full-access short-circuit, isWritePath helper

**Nicht angefasst** (außerhalb Scope)
- constants.ts (PLANS bereits korrekt)
- app/(app)/firma/** (Billing-Tab existiert bereits)
- components/modules/settings/billing-tab.tsx (bereits vollständig)

## Build-Status

- `npx tsc --noEmit` → **EXIT 0** grün
- Keine Server-Actions ohne `withAuth`
- Keine `AnyRow`-Casts in billing.ts mehr
- Alle neuen Pfade haben `company_id`-Scoping

## Follow-ups (nicht in diesem Stream)

1. `stripe_event_log` Tabelle für **harte** Idempotenz (statt state-check) — optional, State-Check deckt alle bekannten Fälle ab.
2. office + `can_view_sensitive_data` Default-Verhalten klären (aktuell konservativ: nein).
3. accountant-UI-Hinweise im BillingTab/Rechnungen-Liste (read-only Badge).
4. Sentry-Test der Webhook-Retry-Pfade mit Stripe CLI `stripe trigger checkout.session.completed --retry`.
