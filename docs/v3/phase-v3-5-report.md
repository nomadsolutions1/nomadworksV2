# Phase V3-5 — Subunternehmer-Port — Report

**Status:** Abgeschlossen
**TypeScript:** `npx tsc --noEmit` grün (Exit 0)
**Branch:** v3-rebuild
**Team:** Marcus Weber (Frontend) + Elena Petrov (Backend)

## 1. Datei-Liste

### Backend (Elena)
- `lib/actions/subcontractors.ts` — Komplette Neuschreibung mit withAuth-Pattern
- `lib/actions/cross-module.ts` — erweitert um `loadSubsCost` (subs-Kosten via `orders.site_id`)
- `lib/config/navigation.ts` — `disabled: true` entfernt vom Subunternehmer-Eintrag

### Frontend (Marcus)
- `app/(app)/subunternehmer/page.tsx` — Server Component, Liste
- `app/(app)/subunternehmer/loading.tsx` — `ModulePageSkeleton`
- `app/(app)/subunternehmer/neu/page.tsx` — Anlegen
- `app/(app)/subunternehmer/[id]/page.tsx` — Detail (Server Component)
- `components/modules/subcontractors/subcontractor-list.tsx`
- `components/modules/subcontractors/subcontractor-form.tsx`
- `components/modules/subcontractors/subcontractor-detail.tsx`
- `components/modules/subcontractors/subcontractor-assignment-list.tsx`
- `components/modules/subcontractors/subcontractor-assignment-dialog.tsx`
- `components/modules/subcontractors/tax-exemption-badge.tsx` (wiederverwendbar, inkl. `getTaxExemptionStatus` Helper)
- `components/modules/subcontractors/rating-display.tsx` (`RatingDisplay` + `RatingInput`)

## 2. v1-Features — Port-Status

| Feature | v1 | v2 | Status |
|---|---|---|---|
| Liste mit Firmenname, Gewerk | ✓ | ✓ | portiert + Filter (all/active/warning) |
| §48b Freistellungsbescheinigung Tracking | ✓ | ✓ | portiert, prominent als Badge |
| §48b Warnung 30 Tage vor Ablauf | ✓ | ✓ | `getTaxExemptionStatus()` |
| §13b Reverse Charge | ✓ (Feld) | ✓ | portiert inkl. Zertifikatsgültigkeit |
| Bewertungen (Qualität/Zuverlässigkeit/Preis) | ✓ | ✓ | `RatingInput` statt `ControlledStarRating` |
| Assignments pro Auftrag | ✓ | ✓ | portiert |
| Assignment-Delete | ✓ | ✓ | mit ConfirmDialog |
| Subcontractor soft-delete | ✗ (hard delete) | ✓ | Verbesserung: `deleted_at` |
| Active-Assignment Counter | ✓ | ✓ | portiert (scoped) |
| `markAssignmentCompleted` | ✗ | ✓ | Neu (Scope-Anforderung) |
| `getSubcontractorsWithExpiringExemption` | ✗ | ✓ | Neu (Dashboard-Warnings) |
| `rateSubcontractor` | ✗ (via update) | ✓ | Neu (Scope-Anforderung) |
| §13b-Logik auf Rechnungen | N/A in v1 (nur Feld) | — | Nicht im Subunternehmer-Scope; Flag ist portiert, Rechnungs-Logik bleibt Invoice-Modul |
| Activity-Log | ✗ | ✓ | **Neu** — jede Mutation loggt |

## 3. Security-Findings in v1 (und Fixes)

### CRITICAL — Cross-Company Bug bei subcontractor_assignments (bestätigt)

v1 `updateAssignment`, `deleteAssignment`:
```ts
.eq("id", assignmentId)
.eq("subcontractor_id", subcontractorId)   // KEIN company_id!
```

Das ist ein **echter Cross-Company-Bug**: Mit gefälschter (oder versehentlich falscher) `subcontractorId` + gültiger `assignmentId` aus einer fremden Firma hätte ein Angreifer fremde Assignments bearbeiten/löschen können. Der Subcontractor-Ownership-Check half nicht, weil er auf `subcontractor_id` filterte — nicht auf `company_id` des Assignments selbst.

**v2-Fix (elena-petrov.md bekannte Lücke #2):**
- Jedes `updateAssignment`/`deleteAssignment`/`markAssignmentCompleted` macht jetzt einen harten `SELECT ... WHERE id=X AND company_id=Y` Ownership-Check vor der Mutation.
- Update/Delete filtern zusätzlich mit `.eq("company_id", profile.company_id)`.
- `assignmentId` statt `assignmentId + subcontractorId` — `subcontractor_id` wird aus der DB gelesen.

### MEDIUM — Fehlende Order-Ownership bei createAssignment

v1 hat `order_id` ungeprüft eingefügt — ein User konnte ein Assignment an einen fremden Auftrag hängen.

**v2-Fix:** `createAssignment` prüft jetzt explizit, dass der `order_id` zur Company gehört.

### MEDIUM — `getAssignments` ohne Subcontractor-Ownership-Check

v1 filterte nur auf `subcontractor_id + company_id`. Wenn die Subcontractor-ID nicht existiert oder fremd ist, gibt die Query einfach leeres Array zurück — nicht sicher, aber auch kein Leak. V2 macht jetzt einen expliziten Ownership-Check mit klarer Fehlermeldung.

### LOW — Activity-Log fehlte komplett in v1 (für Subunternehmer)

Kein Commit, kein Audit-Trail. **Fix:** Alle 8 Mutationen (create/update/delete Subcontractor, create/update/delete/complete Assignment, rate) loggen jetzt via `logActivity`.

### LOW — `AnyRow` Casts in v1

v1 nutzte `type AnyRow = Record<string, unknown>` um die DB-Row-Typen zu umgehen. **Fix:** v2 verwendet `Database["public"]["Tables"]["..."]["Row"]` — null `AnyRow`.

### LOW — Hard Delete statt Soft Delete

v1 machte `.delete()` — wenn Assignments referenzierten, failte es oder hinterließ Waisen. **Fix:** v2 setzt `deleted_at` und nutzt `.is("deleted_at", null)` überall.

## 4. Schema-Abweichungen

- `subcontractors.reverse_charge_13b` — `boolean | null` (v1 annahm `boolean`). Geändert: Form schreibt expliziten Boolean.
- `subcontractors.deleted_at` existiert in v2-Schema → wird benutzt für Soft-Delete (v1 ignorierte es).
- `subcontractor_assignments` hat KEIN `site_id`. Assignments hängen an `orders.id`, und `orders.site_id` liefert die Baustellen-Beziehung. `loadSubsCost` in `cross-module.ts` geht deshalb den Umweg: `orders WHERE site_id=X → subcontractor_assignments WHERE order_id IN(...)`.
- `subcontractors.address` ist ein **einzelnes String-Feld** (nicht strukturiert wie bei Employees). Form benutzt daher `<Input name="address">`, nicht `AddressFields`.

## 5. Cross-Module-Erweiterung

`getSiteCosts.subs` ist jetzt echt berechnet (vorher Platzhalter 0):
- Lädt alle `orders` mit `site_id === siteId` und `company_id === profile.company_id`
- Lädt alle `subcontractor_assignments` mit `order_id IN (...)` und Status ≠ `cancelled`
- Summiert: `invoiced_amount ?? agreed_amount ?? 0` — in Rechnung gestellter Betrag hat Vorrang, sonst vereinbart, sonst 0
- Vollständig `company_id`-scoped (Defense in Depth)

**Signatur bleibt identisch** — keine Breaking Changes für andere Module.

## 6. Navigation

`lib/config/navigation.ts`: `disabled: true` entfernt — Subunternehmer erscheint jetzt für Owner + berechtigte Foreman in der Sidebar.

## 7. Test-Plan für Mikail (QA)

### Happy Path
1. `/subunternehmer` → Liste erscheint, Empty-State wenn leer
2. "Subunternehmer hinzufügen" → Form → `Name`, `Gewerk`, `§48b bis` (Datum in 10 Tagen → Warning) → Bewertung 4 Sterne → Speichern
3. Liste zeigt neuen Eintrag mit §48b-Badge `Läuft bald ab` (warning)
4. Detail → Stammdaten → Edit-Form unten → Bewertung auf 5 ändern → Speichern
5. Detail → Einsätze → "Einsatz anlegen" → Auftrag wählen → Beschreibung → Vereinbart 2.500 € → Anlegen
6. Assignment erscheint als "Aktiv" → Grüner Haken → "Abgeschlossen"
7. Liste → Aktive-Einsätze Counter aktualisiert sich (nach Refresh)

### §48b Szenarien
1. `§48b bis` heute − 1 Tag → Badge `danger`, Warnbanner im Detail
2. `§48b bis` heute + 15 Tage → Badge `warning`, Warnbanner im Detail
3. `§48b bis` heute + 90 Tage → Badge `success`
4. Kein Datum → Badge `neutral` "Nicht hinterlegt"
5. Filter "§48b Warnung" auf der Liste → zeigt nur expired + expiring

### §13b
1. Checkbox §13b aktivieren → Nachweis-Datum-Feld wird klickbar
2. Speichern → Detail zeigt "§13b Reverse Charge: Aktiv" + Nachweis bis
3. Deaktivieren → Feld disabled

### Security-Tests (kritisch für v1-Bug)
1. **Cross-Company Update:** User A legt Assignment X an. User B (andere Company) ruft `updateAssignment(X, ...)` direkt → muss `{error: "Einsatz nicht gefunden"}` zurückgeben, keine Daten ändern.
2. **Cross-Company Delete:** Analog → keine Löschung.
3. **Fremder Order bei createAssignment:** User A versucht Assignment mit Order-ID von Company B → `{error: "Auftrag nicht gefunden"}`.
4. **Worker-Rollen:** Worker/Employee sieht `/subunternehmer` nicht (Sidebar + 403 bei Direkt-URL).
5. **Foreman ohne Permission:** Kein Zugriff (withAuth → Keine Berechtigung).
6. **Owner einer fremden Company:** `getSubcontractor(id_aus_fremder_firma)` → "Subunternehmer nicht gefunden".

### Activity-Log
- Nach jeder Mutation sollte `activity_log` neue Zeile haben (`entity_type = 'subcontractor' | 'subcontractor_assignment'`).

### Cross-Module
1. Baustelle mit Auftrag → Auftrag hat Assignments → `getSiteCosts(siteId)` liefert `subs > 0`
2. Status `cancelled` wird nicht mitgezählt
3. `invoiced_amount` hat Vorrang vor `agreed_amount`

### Navigation
- Owner sieht "Subunternehmer" in der Sidebar
- Kein `disabled`-Styling mehr

## 8. Blocker / Open Items

**Keine.** Phase ist fertig, TypeScript grün, Pattern v3-3/v3-4 konsistent angewendet.

Backlog für später:
- `updateAssignment` UI (edit-Dialog) ist im Backend vorhanden, Frontend zeigt bisher nur Delete + Complete. Für V3-6 falls gewünscht.
- Dashboard-Widget für §48b-Warnings (Backend-Funktion `getSubcontractorsWithExpiringExemption` steht bereit, Anbindung im Dashboard kann später erfolgen).
- `getActiveWarnings` als einheitlicher Aggregator (TÜV + §48b + ggf. weitere) — nicht in diesem Scope, aber Basis ist gelegt.
