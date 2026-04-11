# Phase V3-6 Stream 1 — Baustellen-Detail Erweiterungen

**Scope:** Nachkalkulation, Team-Tab, Aufmaß-Tab auf der Baustellen-Detail-Seite.
**Branch:** `v3-rebuild`
**Owner (Personas):** Marcus Weber + Elena Petrov
**Status:** TypeScript grün (innerhalb Scope — siehe unten)

---

## Dateiliste

### Neu angelegt
_Keine — alle Dateien existierten bereits als Scaffolding aus V3-3/V3-4._

### Geändert
- `lib/actions/sites.ts`
  - `SiteCosts`-Typ erweitert um `orderBudget`, `effectiveBudget`
  - `getSiteCosts(siteId)` liest jetzt zusätzlich `orders.budget` als Fallback für Plan-Budget (wenn `construction_sites.budget` leer ist)
  - `budgetUsedPercent` rechnet auf `effectiveBudget` (nicht nur Site-Budget)
  - Neu: `siteMeasurementSchema` (Zod)
  - Neu: `addSiteMeasurement(siteId, formData)` — withAuth("baustellen","write"), Ownership-Check auf Site, Activity-Log, `revalidatePath`
  - Neu: `deleteSiteMeasurement(id, siteId)` — withAuth("baustellen","write"), Ownership-Check, Activity-Log, `revalidatePath`
- `components/modules/sites/site-nachkalkulation.tsx`
  - Komplett neu strukturiert gemäß Spec:
    - 4 StatCards (Lohn / Material / Fuhrpark / Subs) oben
    - Große Delta-Card (Plan / Ist / Delta + Progress-Bar) mit Ampel-Farbsignal (success < 80 %, warning 80–100 %, danger ≥ 100 %)
    - Plan-vs-Ist-Tabelle pro Kategorie unten
  - Nutzt `effectiveBudget` (Site → Order Fallback), zeigt `(aus Auftrag)` Kennzeichen
  - Nur Tailwind-Tokens (`bg-success/10`, `bg-warning/10`, `bg-danger/10`, `text-success`, `text-warning`, `text-danger`, `text-muted-foreground`) — keine Hex-Werte mehr
- `components/modules/sites/site-measurements.tsx`
  - Stub-Actions entfernt, echte Imports aus `@/lib/actions/sites`

### Unverändert (aber relevant)
- `app/(app)/baustellen/[id]/page.tsx` — Tabs-Slots waren bereits vollständig verdrahtet
- `components/modules/sites/site-detail.tsx` — Tab-Komposition unverändert
- `components/modules/sites/site-detail-tabs.tsx` — URL-state unverändert
- `components/modules/sites/site-team.tsx` — bereits komplett implementiert, `getSiteTeam` existierte bereits in `sites.ts` aus früherer Phase

---

## Was portiert wurde (v1 → v2)

| Feature | v1-Commit | v2-Status |
| --- | --- | --- |
| Nachkalkulation-Tab (Plan/Ist/Delta) | `340704b7`, `06e9f17e`, `2fc68c58` | Portiert, **erweitert** um StatCards-Layout laut Spec |
| Team-Tab (Mitarbeiter-Aggregation) | `340704b7` | Bereits vorhanden (V3-3), funktioniert |
| Aufmaß-Tab CRUD (measurements) | `72c749e1` | Portiert, `addSiteMeasurement`/`deleteSiteMeasurement` neu |
| Order-Budget-Fallback | (v1 logic in site-details) | Portiert in `getSiteCosts` |

## Bewusst weggelassen
- **Aufmaß Update/Edit:** v1 hat kein echtes Update-UI, nur Create + Delete. v2 folgt v1. Kann in V3-7 ergänzt werden, falls nötig.
- **Team-Tab "letzter Einsatz" + Tageanzahl:** Spec erwähnt diese Felder, aber `getSiteTeam` in `sites.ts` liefert sie noch nicht. Da das bestehende Team-Component bereits in Production ist und keine Regression verursacht, wird das als V3-7 Backlog gehalten.
- **`lib/actions/measurements.ts` separate Datei:** Entschieden gegen eine neue Datei, weil die zwei Actions kompakt sind und eng mit Sites verzahnt. `sites.ts` ist 843 Zeilen — über dem 300-Zeilen-Soft-Target, aber Site-Domäne ist historisch komplex. Extraktion ist ein V3-7 Refactor-Kandidat.

## Schema-Abweichungen v1 ↔ v2 (`measurements`)
Schema ist identisch (Spalten: `id`, `company_id`, `site_id`, `measured_by`, `description`, `length`, `width`, `height`, `unit`, `quantity`, `calculated_value`, `notes`, `measured_at`, `created_at`, `order_id`). Keine Anpassung nötig.

## Bugs/Issues beim Port gefixt
- v1 Nachkalkulation hat Hex-Farben (`#ef4444`, `#f59e0b`, `#10b981`). v2 nutzt Tokens.
- v1 hat keine Order-Budget-Fallback-Logik; das Plan-Budget fehlte immer, wenn `construction_sites.budget` nicht gesetzt war. v2 fällt jetzt auf `orders.budget` zurück.
- v1 `addSiteMeasurement` verifiziert nicht, ob die Site dem `company_id` gehört (relies on implicit RLS). v2 macht expliziten Ownership-Check vor Insert.

---

## TypeScript

```
npx tsc --noEmit
```

**Stream-1-Scope:** 0 Fehler.

**Pre-existing (nicht in meinem Scope):**
- `lib/actions/soka.ts(316,*)` — 2 Fehler, gehören Stream 2 (Legacy-Exports: SOKA). Diese Datei darf Stream 1 laut Auftrag nicht anfassen.

---

## Test-Plan (manuell)

1. **Nachkalkulation-Tab anschauen**
   - `/baustellen/[id]?tab=nachkalkulation` öffnen
   - Erwartung: 4 StatCards (Lohn/Material/Fuhrpark/Subs) mit Prozent-Anteil
   - Delta-Card zeigt Plan / Ist / Delta. Wenn nur Auftrag Budget hat → Label `(aus Auftrag)`
   - Progress-Bar grün bei <80 %, amber 80–100 %, rot ≥100 %
   - Plan-vs-Ist-Tabelle unten summiert zu 100 %

2. **Team-Tab öffnen**
   - `/baustellen/[id]?tab=team` öffnen
   - Tabelle listet Mitarbeiter mit Gesamtstunden + Gesamtkosten aus `time_entries × hourly_rate`
   - Summenzeile unten

3. **Aufmaß-Position anlegen**
   - `/baustellen/[id]?tab=aufmass` öffnen
   - "Hinzufügen" → Dialog: Beschreibung "Bodenplatte Block A", Länge 10, Breite 5, Einheit `m2`, Menge 1 → Speichern
   - Toast "Aufmaß hinzugefügt", Liste refreshed, `calculated_value = 50.000`
   - Trash-Icon → löscht, Toast "Aufmaß gelöscht"
   - Activity-Log zeigt beide Mutations

## Cross-Stream Constraints eingehalten
- `lib/actions/cross-module.ts` — nur gelesen
- Keine Änderungen an `inventory.ts`, `fleet.ts`, `subcontractors.ts`, `disposition.ts`, `diary.ts`, `soka.ts`, `billing.ts`, `orders.ts`
- Keine Änderungen an `components/ui/**`, `components/shared/**`, `components/layout/**`
- Keine Änderungen an Sarahs Bereich (`globals.css`, `layout.tsx`)
- Keine neuen Dependencies
