# RBAC Matrix — v3 Launch-Readiness (G6)

**Auditor:** James Park (QA & Reliability)
**Datum:** 2026-04-10
**Scope:** Code-Audit der RBAC-Regeln gegen `proxy.ts`, `lib/utils/auth-helper.ts` und alle `withAuth(...)`-Aufrufe in `lib/actions/*.ts`.
**Methode:** Statische Analyse der drei Enforcement-Schichten (Proxy → Server-Action withAuth → Settings-Role-Checks). Keine manuellen Klick-Tests.

---

## Legende

- `YES` — explizit erlaubt, Code-Pfad verifiziert
- `NO` — explizit verweigert (Redirect oder `{ error: "Keine Berechtigung" }`)
- `OWN` — nur eigene Daten (z. B. Worker sehen nur eigene Time-Entries)
- `R/O` — read-only (write-Pfad zurückgewiesen)
- `N/A` — Rolle hat keinen Zugang zum Modul (außerhalb der Matrix)

## Rollen

1. **super_admin** — Plattform-Admin (nutzt `/admin`, keine Company)
2. **owner** — Firmeninhaber, voller Zugriff
3. **foreman** — Polier, Zugriff nach `foreman_permissions`
4. **office** — Büro, voller Zugriff auf alle Standardmodule (Role-Delta V3-7)
5. **accountant** — Steuerberater, R/O auf whitelisted Module (Role-Delta V3-7)
6. **worker** — Arbeiter, nur Zeiterfassung + Profil + Stundenzettel
7. **employee** — Stammdaten-Benutzer, nur `/profil`

---

## Module × Rolle × Action (392 Kombinationen, gruppiert)

### 1. Dashboard (`/dashboard`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO → /admin | NO | NO | NO |
| owner | YES | N/A | N/A | N/A |
| foreman | YES | N/A | N/A | N/A |
| office | YES | N/A | N/A | N/A |
| accountant | YES | N/A | N/A | N/A |
| worker | NO → /zeiterfassung | NO | NO | NO |
| employee | NO → /profil | NO | NO | NO |

### 2. Mitarbeiter (`/mitarbeiter`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO | NO | NO | NO |
| owner | YES | YES | YES | YES |
| foreman | YES (sensitive gefiltert) | YES (foreman_permissions) | YES | YES |
| office | YES (sensitive gefiltert) | YES | YES | YES |
| accountant | R/O | NO | NO | NO |
| worker | NO | NO | NO | NO |
| employee | NO | NO | NO | NO |

**Hinweis:** `filterSensitiveData()` entfernt `hourly_rate`, `iban`, `tax_class` etc. für foreman/accountant ohne `can_view_sensitive_data`. ✅ verifiziert.

### 3. Baustellen (`/baustellen`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO | NO | NO | NO |
| owner | YES | YES | YES | YES |
| foreman | (permissions) | (permissions) | (permissions) | (permissions) |
| office | YES | YES | YES | YES |
| accountant | NO | NO | NO | NO |
| worker | NO | NO | NO | NO |
| employee | NO | NO | NO | NO |

### 4. Zeiterfassung (`/zeiterfassung`, `/stempeln`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO | NO | NO | NO |
| owner | YES | YES | YES (correctTimeEntry) | YES |
| foreman | (permissions) | OWN clockIn/Out | (permissions) | (permissions) |
| office | YES | OWN | YES | YES |
| accountant | NO | NO | NO | NO |
| worker | **OWN** (eigene Einträge) | **OWN clockIn/Out** | NO | NO |
| employee | NO | NO | NO | NO |

**Finding R1 (INFO):** `clockIn`/`clockOut` laufen mit `withAuth(null, "write")` ohne Modul-Check. Begründet durch Worker-Requirement ("Workers müssen stempeln können"). Sicher, solange die Actions nur auf `user.id === auth.user.id` schreiben. **Verifiziert:** `time-entries.ts:146,216` setzen `user_id: user.id`.

### 5. Disposition (`/disposition`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO | NO | NO | NO |
| owner | YES | YES | YES | YES |
| foreman | (permissions) | (permissions) | (permissions) | (permissions) |
| office | YES | YES | YES | YES |
| accountant | NO | NO | NO | NO |
| worker | NO | NO | NO | NO |
| employee | NO | NO | NO | NO |

### 6. Aufträge (`/auftraege`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO | NO | NO | NO |
| owner | YES | YES | YES | YES |
| foreman | (permissions) | (permissions) | (permissions) | (permissions) |
| office | YES | YES | YES | YES |
| accountant | NO | NO | NO | NO |
| worker | NO | NO | NO | NO |
| employee | NO | NO | NO | NO |

### 7. Fuhrpark (`/fuhrpark`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO | NO | NO | NO |
| owner | YES | YES | YES | YES |
| foreman | (permissions) | (permissions) | (permissions) | (permissions) |
| office | YES | YES | YES | YES |
| accountant | NO | NO | NO | NO |
| worker | NO | NO | NO | NO |
| employee | NO | NO | NO | NO |

### 8. Lager & Einkauf (`/lager`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO | NO | NO | NO |
| owner | YES | YES | YES | YES |
| foreman | (permissions) | (permissions) | (permissions) | (permissions) |
| office | YES | YES | YES | YES |
| accountant | NO | NO | NO | NO |
| worker | NO | NO | NO | NO |
| employee | NO | NO | NO | NO |

### 9. Rechnungen (`/rechnungen`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO | NO | NO | NO |
| owner | YES | YES | YES | YES |
| foreman | (permissions) | (permissions) | (permissions) | (permissions) |
| office | YES | YES | YES | YES |
| accountant | **R/O** | NO | NO | NO |
| worker | NO | NO | NO | NO |
| employee | NO | NO | NO | NO |

### 10. Subunternehmer (`/subunternehmer`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO | NO | NO | NO |
| owner | YES | YES | YES | YES |
| foreman | (permissions) | (permissions) | (permissions) | (permissions) |
| office | YES | YES | YES | YES |
| accountant | NO | NO | NO | NO |
| worker | NO | NO | NO | NO |
| employee | NO | NO | NO | NO |

### 11. Bautagesbericht (`/bautagesbericht`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO | NO | NO | NO |
| owner | YES | YES | YES | YES |
| foreman | (permissions) | (permissions) | (permissions) | (permissions) |
| office | YES | YES | YES | YES |
| accountant | NO | NO | NO | NO |
| worker | NO | NO | NO | NO |
| employee | NO | NO | NO | NO |

### 12. Firma / Settings (`/firma`)

| Rolle | read | create | edit | delete |
|---|---|---|---|---|
| super_admin | NO (nutzt Admin) | NO | NO | NO |
| owner | YES | YES | YES | YES |
| foreman | NO | NO | NO | NO |
| office | NO | NO | NO | NO |
| accountant | **R/O (nur soka-export, steuerberater)** | NO | NO | NO |
| worker | NO | NO | NO | NO |
| employee | NO | NO | NO | NO |

**Enforcement:** Proxy (`ownerOnlyRoutes`) + `settings.ts` (`getCompanyIdAndRole` prüft `owner`/`super_admin`). Doppelt verriegelt. ✅

### 13. Profil (`/profil`)

Alle authentifizierten Rollen dürfen ihr eigenes Profil lesen/ändern. Kein Modul-Check. ✅

### 14. Benachrichtigungen (`/benachrichtigungen`)

Alle authentifizierten Rollen. Worker sehen nur eigene + broadcast (`user_id.is.null`). ✅ `notifications.ts` filtert nach `company_id` und `user_id`.

### 15. Admin (`/admin`) — nicht in 14-Module-Matrix

| Rolle | Zugriff |
|---|---|
| super_admin | YES |
| alle anderen | NO → /dashboard |

Actions in `admin.ts` nutzen `verifySuperAdmin()` als separaten Guard. ✅

---

## Findings

### Finding R1 (INFO, keine Action) — clockIn/clockOut ohne Modul-Check
`time-entries.ts` nutzt `withAuth(null, "write")`, damit Worker stempeln können. Das ist beabsichtigt. Die Actions schreiben nur mit `user_id: user.id`, `company_id: profile.company_id` — kein Cross-Company-Leak möglich.

### Finding R2 (NOTED) — `isWritePath()` als URL-Heuristik
`proxy.ts:26` klassifiziert Writes per Pfad-Suffix (`/neu`, `/bearbeiten`). Das ist eine Defense-in-Depth-Schicht, aber nicht autoritativ. Die echte Durchsetzung liegt in `withAuth(..., "write")` auf Server-Action-Ebene. Solange die Actions korrekt auf `"write"` gesetzt sind, hält das Modell.

### Finding R3 (NOTED) — Onboarding-Redirect liest Profile zweimal
`proxy.ts:202` ruft eine verschachtelte `profiles → companies`-Abfrage auf, die langsam ist und bei Fehlern stillschweigend weiterläuft (kein Fail-Closed). Kein Sicherheitsproblem, aber Performance-Wart. → V1.1.

### Finding R4 (NOTED) — super_admin ist nicht im company-Scope
`super_admin` kann KEINE company-scoped Aktionen ausführen (durch `requireCompanyAuth` blockiert). Das ist korrekt (Separation of Concerns), aber Admin-Actions (`admin.ts`) umgehen `withAuth` bewusst. Überprüft: Jede Admin-Action ruft `verifySuperAdmin()` als ersten Schritt. ✅

### Finding R5 (NOTED) — Accountant-Firma-Bypass-Gefahr
`proxy.ts:193` erlaubt Accountant explizit `/firma/soka-export` und `/firma/steuerberater`, aber fällt danach **nicht** durch zum `ownerOnlyRoutes`-Check. Das ist korrekt gelöst mit der frühen `return response`-Klausel. ✅

### Finding R6 (FIXED) — Stale `disabled: true` Flags in navigation.ts
`lager` hatte noch `disabled: true` obwohl das Modul in v3 portiert ist (`app/(app)/lager` existiert, Actions sind aktiv). **Fix:** `disabled`-Flag entfernt. Fuhrpark und Subunternehmer waren bereits korrekt.

### Finding R7 (NOTED, nicht kritisch) — `isWritePath()` matcht keine POST-Endpoints
Die Heuristik erkennt `/neu` und `/bearbeiten` — sie erkennt aber keine Server-Action-POSTs, die direkt vom Dashboard aus abgefeuert werden (Inline-Edit). Deshalb ist die Server-Action-Schicht mit `withAuth(..., "write")` die einzige autoritative Write-Barriere für Accountant. Verifiziert: alle `*.ts` Actions, die Daten mutieren, haben `mode: "write"` oder rufen `verifySuperAdmin`/owner-check.

---

## Zusammenfassung

**Enforcement-Architektur:** Three-Layer Defense in Depth
1. **Proxy (`proxy.ts`)** — Route-Level Redirects nach Rolle
2. **withAuth (`auth-helper.ts`)** — Server-Action-Level Module+Mode-Check
3. **RLS in DB (Supabase)** — als letztes Safety-Net (falls Admin-Client jemals verwechselt wird)

**RBAC-Status:** ✅ **GO** — keine Rolle hat Zugriff auf Routen/Actions, die ihr nicht zustehen. Die bekannten Patterns (clockIn ohne Modul-Check, Accountant-Whitelist) sind beabsichtigt und sicher implementiert.

**Offene Punkte:** keine Blocker. R3/R7 sind Performance-/Code-Quality-Items für V1.1.
