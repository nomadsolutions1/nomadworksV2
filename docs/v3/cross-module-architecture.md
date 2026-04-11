# Cross-Module Architektur (v3)

**Autor:** David Mueller, Engineering Director
**Datum:** 2026-04-10
**Status:** verbindlich für v3-rebuild
**Entscheidungs-Revision:** Ursprünglich Plan B (Events, 3 Wochen). Mit Mikail auf **Plan C / pragmatische Query-Aggregation** revidiert. Events bleiben optionaler V1.1-Pfad (siehe §5).

---

## 1. Use Cases — was der User erlebt

Jedes Feature wird aus mehreren Modul-Tabellen zusammengezogen. Single Source of Truth bleibt die jeweilige Fach-Tabelle. Keine Duplikate.

| # | Feature | Anzeige-Ort | Liest aus | Aggregation |
|---|---|---|---|---|
| 1 | **Baustellen-Kostentracker** | `baustellen/[id]` Kosten-Tab + Dashboard-Card | `time_entries`, `stock_movements`, `equipment_costs`+`trip_logs`, `subcontractor_assignments`+`subcontractor_invoices` | Sum(Stunden × Stundensatz) + Sum(Material-Entnahmen × Preis) + Sum(Fahrzeug-Einsatztage × Tagessatz) + Sum(Sub-Rechnungen). Gruppiert nach Kategorie. |
| 2 | **Auftrags-Nachkalkulation** | `auftraege/[id]` Nachkalk-Tab | `orders` (Plan), + wie #1 gefiltert auf `order_id` | `plan − ist = delta`. Zusätzlich Margin %. |
| 3 | **Dashboard-Übersicht** | `dashboard` | `time_entries` (diese Woche), `orders` (aktive), Warnings aus #7 | Diese Woche: Stunden, Kosten, Top-3 teuerste Baustellen, offene Warnungen. |
| 4 | **Mitarbeiter-Auswertung** | `mitarbeiter/[id]` + Dashboard-Widget | `time_entries`, `profiles` | Stunden/Tag, Stunden/Woche, Überstunden, 40h/45h-Check. |
| 5 | **Fahrzeug-Auslastung** | `fuhrpark/[id]` | `asset_assignments`, `trip_logs` | Einsatztage pro Monat, km/Monat, Leerstandstage. |
| 6 | **Material-Rückfluss-Erkennung** | `lager/[materialId]` Verwendung-Tab | `stock_movements` mit `order_id`/`site_id` | "Wurde wo eingesetzt, wieviel liegt noch." |
| 7 | **Soft-Warnings** | Dashboard Warn-Card + Badge in Sidebar | `orders.budget` vs #2, `time_entries` vs 45h/Wo, `vehicles.tuev_until` | Budget-Überschreitung >100%, MA über Limit, TÜV/UVV in ≤14 Tagen. |

Alle 7 Features lesen ausschließlich — kein einziger Cross-Module-Write. Writes bleiben in den Modul-Actions (`time-entries.ts`, künftig `inventory.ts` usw.).

---

## 2. Technisches Pattern

**Einheitliche Regel für alle Cross-Module-Reads:**

1. **Ort:** `lib/actions/cross-module.ts` (neuer Ordner nicht nötig — eine Datei reicht, wird bei >600 Zeilen in Unterordner gesplittet).
2. **Eingabe:** `entityId` (`site_id | order_id | user_id | vehicle_id | material_id`) + optional `range: { from: Date; to: Date }`.
3. **Intern:** Parallele Supabase-Queries via `Promise.all([...])` über die relevanten Tabellen. Kein sequentielles Awaiten.
4. **Aggregation:** Pure Function innerhalb der Server Action (kein Client-Code, keine RPC). Stateless, einfach testbar.
5. **Rückgabe:** Typisiertes Ergebnis-Objekt mit Kategorien (`labor | material | fleet | subs | total`) — Zahlen in Cents (bigint/number), keine formatted Strings.
6. **Auth:** `withAuth(null, "read")` — jede Action klebt an den bestehenden Auth-Helpers. Rollen-Check auf das **Haupt-Modul** des Kontexts (z.B. `getSiteCosts` → `"baustellen"`, `getEmployeeHours` → `"mitarbeiter"`).
7. **Tenant-Filter:** `company_id` **Pflicht auf jede Einzel-Query**. Kein "wir filtern am Ende", kein Trust auf FK-Joins.
8. **Null-Safety:** Jede Query darf leer sein. Aggregation fällt auf `0` zurück. Keine `.single()`-Aufrufe, keine `!`-Assertions.
9. **Kein Caching im MVP.** Kein `unstable_cache`, kein `use cache`. Next.js 16 liefert pro-Request-Deduping out of the box. Wenn echte Cache-Pain auftritt → gezielt pro Action, nicht global.
10. **Error-Handling:** Ein Query-Fehler → gesamte Action failed lauter (`throw`), keine stillen Teil-Ergebnisse. Soft-Warnings-Badge darf fehlen, Kostentracker nicht.

**Was das bedeutet praktisch:** Marcus kann beim Lager-Port `getSiteCosts` aufrufen ohne neue Konzepte zu lernen. Es sieht aus wie jede andere Server Action.

---

## 3. Konkrete Schnittstellen

```typescript
// lib/actions/cross-module.ts

type DateRange = { from: Date; to: Date }

type CostBreakdown = {
  labor: number       // Cents
  material: number
  fleet: number
  subs: number
  total: number
}

/** Summe aller Kosten einer Baustelle, optional Zeitraum. Haupt-Action für Kostentracker + Dashboard. */
export async function getSiteCosts(
  siteId: string,
  range?: DateRange
): Promise<CostBreakdown>

/** Plan-vs-Ist einer Auftrags-ID inkl. Delta und Marge. Liest `orders` + delegiert an getSiteCosts für Ist-Seite. */
export async function getOrderCalculation(
  orderId: string
): Promise<{ plan: CostBreakdown; actual: CostBreakdown; delta: CostBreakdown; marginPct: number }>

/** Dashboard-Top-Panel: KPIs der aktuellen Woche + Warn-Count. Ein Roundtrip, liefert das gesamte Dashboard-Header-Widget. */
export async function getDashboardOverview(): Promise<{
  weekHours: number
  weekCosts: CostBreakdown
  activeSites: number
  warningsCount: number
}>

/** Stunden-Aggregation für einen MA im Zeitraum, inkl. 40h/45h-Violation-Flags. Für Mitarbeiter-Profil + Lohn-Export. */
export async function getEmployeeHours(
  userId: string,
  range: DateRange
): Promise<{ total: number; perDay: { date: string; hours: number }[]; overtime: number; weeklyViolations: string[] }>

/** Fahrzeug-Auslastung: Einsatztage, km, Leerstand. Basis für Fuhrpark-Kostenstellen. */
export async function getVehicleUtilization(
  vehicleId: string,
  range: DateRange
): Promise<{ daysUsed: number; daysIdle: number; km: number; utilizationPct: number }>

/** Verwendungs-Historie eines Materials — wo wurde es entnommen, wieviel liegt noch. */
export async function getMaterialUsage(
  materialId: string,
  range?: DateRange
): Promise<{ stockOnHand: number; usedBySite: { siteId: string; siteName: string; qty: number }[] }>

/** Alle aktiven Soft-Warnings der Firma. Budget>100%, MA>45h, TÜV<=14d. Liefert max 50, sortiert nach Severity. */
export async function getActiveWarnings(): Promise<Array<{
  kind: "budget_overrun" | "overtime" | "tuev_due"
  severity: "info" | "warn" | "critical"
  entityId: string
  entityLabel: string
  message: string
}>>
```

**7 Cross-Module Actions.** Das ist die gesamte Oberfläche. Alles andere läuft über die Modul-Actions selbst.

---

## 4. Performance-Richtwerte

**Ziel-Firmengröße für MVP:** 10-100 Mitarbeiter, 30 aktive Baustellen, 5000 Zeiteinträge/Monat.

| Action | Ziel p95 | Queries parallel | Worst-Case-Load |
|---|---|---|---|
| `getSiteCosts` | <150ms | 4 | ~500 rows/query |
| `getOrderCalculation` | <200ms | 5 (inkl. plan) | ~500 rows/query |
| `getDashboardOverview` | <300ms | 6-8 | ~5000 rows (week-filter) |
| `getEmployeeHours` | <100ms | 1-2 | ~200 rows (30d × 6 entries) |
| `getVehicleUtilization` | <100ms | 2 | ~100 rows |
| `getMaterialUsage` | <150ms | 2 | ~300 rows |
| `getActiveWarnings` | <250ms | 3 + post-filter | ~5000 rows |

**Voraussetzungen:** B-Tree-Indizes auf `(company_id, site_id, date)` für `time_entries`, `stock_movements`, `trip_logs`, `subcontractor_invoices`. Elena muss diese Indizes beim Modul-Port mit anlegen — ein Satz pro Modul in der Migration.

**Bei 500+ MA / 50.000+ Zeiteinträge/Monat:** Folgende Optionen in dieser Reihenfolge, ohne Architektur-Bruch:
1. **Postgres Materialized View** `mv_site_costs_daily`, nightly refresh via Cron → `getSiteCosts` liest MV statt 4 Tabellen.
2. **`stock_movements`-Aggregate-Trigger** → `site_cost_cache`-Row pro Baustelle, on-write aktualisiert.
3. **`pg_stat_statements` + `pg_stat_monitor`** zum Identifizieren der tatsächlichen Hot-Queries, bevor blind optimiert wird.

Nichts davon im MVP. Mikail bekommt die Messwerte in V3-12 (Final QA, Load-Test mit realistischem Seed).

---

## 5. Migrations-Pfad zu Events (V1.1)

**Wann:** Sobald ein einzelner Kunde reproduzierbar >500ms p95 auf einer Cross-Module-Action sieht, die sich nicht durch Index + MV lösen lässt.

**Wie — am Beispiel `getSiteCosts`:**

1. Neue Tabelle `site_cost_cache(site_id, labor, material, fleet, subs, total, updated_at)`.
2. Publisher-Hook in den **vier schreibenden Actions** (`time-entries.ts.createTimeEntry`, `inventory.ts.withdrawMaterial`, `fleet.ts.logTrip`, `subcontractors.ts.addInvoice`) — jeweils ein einziger `upsertSiteCost(siteId)` Call nach erfolgreichem Write.
3. `getSiteCosts` liest primär aus `site_cost_cache`. Fallback auf Live-Aggregation wenn Row fehlt oder älter als 60s (Self-Healing).
4. Bestehende 6 anderen Actions bleiben unangetastet.

**Kein Event-Bus, kein `domain_events`-Store, kein Subscriber-Pattern, keine Rollback-Strategie.** Nur: write-through-Cache mit einer einzigen Zusatz-Zeile in vier Actions. Geschätzter Aufwand wenn es soweit ist: 1 Tag Elena.

Der Punkt: Wir migrieren **pro Hot-Path**, nie holistisch. 90% des Systems bleibt pragmatisch.

---

## 6. Was NICHT gebaut wird

- ❌ `domain_events`-Tabelle
- ❌ Event-Bus / Publisher-Subscriber-Framework
- ❌ Eventual Consistency mit Reconciliation-Jobs
- ❌ Materialized Views im MVP
- ❌ Redis / KV-Cache
- ❌ `unstable_cache` / globales React `cache()`
- ❌ GraphQL-Layer zum "eleganten Joinen"
- ❌ Background Worker / Queues (Inngest, QStash, Trigger.dev)
- ❌ Separater "Analytics Service"

Wenn ein Agent einen PR aufmacht der eines davon einführt: **blockieren, auf dieses Dokument verweisen.**

---

## 7. Transparency — was dieser Ansatz schlechter macht

Mikail soll das wissen, nicht erst wenn es knallt:

- **Read-Amplification:** Jeder Kostentracker-Aufruf macht 4 Queries. Bei 30 Usern gleichzeitig auf Dashboard = 240 Queries/s auf Supabase. Bleibt in Postgres-Tabellen-Fähigkeit, aber wir sehen es im Supabase-Dashboard.
- **Keine "eventual history":** Wir können nicht nachträglich sagen "welche Events passierten um 14:32" — weil es keine Events gibt. Wenn Audit-Trail gefordert wird, brauchen wir `audit_log` separat. Steht nicht im MVP-Scope.
- **Konsistenz ist immer "live":** Race-Condition zwischen zwei Usern die gleichzeitig Zeit + Material auf dieselbe Baustelle buchen → kein Problem (Reads sehen beide nach Commit). Aber: Wenn einer offline bucht und 10min später syncht, zeigt der andere in diesen 10min eine veraltete Sum. Bei der Zielgruppe (ein Chef, ein Dashboard) irrelevant. Bei Multi-Office-Setups (seltene Enterprise) merklich.
- **Kein "alles greift nahtlos" auf DB-Ebene.** Das nahtlose Gefühl entsteht in der UI durch Live-Reads. Fühlt sich für den User gleich an, ist für uns aber ehrlich gesagt eine UX-Illusion, keine Architektur-Wahrheit. Ich halte das für vertretbar weil der USP "ein ERP wo alles zusammenhängt" in der UI verkauft wird, nicht im Datenmodell.

Keine dieser Punkte ist ein Dealbreaker bei 10-100 MA. Alle drei sind adressierbar ohne Rewrite, wenn sie akut werden.

---

## 8. Verantwortlichkeiten

| Wer | Was |
|---|---|
| **David** | Dieses Dokument pflegen. Review jedes PRs der `cross-module.ts` anfasst. |
| **Elena** | Implementation von `cross-module.ts` — parallel zu Modul-Ports. Indizes bei jedem Modul-Port. |
| **Marcus** | Konsument. Ruft Cross-Module-Actions aus Server Components. Baut keine eigenen Aggregationen in Pages. |
| **James** | Performance-Test mit realistischem Seed in V3-12 (50 MA, 30 Sites, 5000 Entries). p95-Report. |
| **Süleyman** | Flagged falls Scope-Creep Richtung Events entsteht. |
