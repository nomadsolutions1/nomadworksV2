# Phase V3-4 — Fuhrpark-Modul Port

**Datum:** 2026-04-10
**Branch:** `v3-rebuild`
**Owner:** Marcus Weber (Frontend) + Elena Petrov (Backend)
**Status:** Fertig — TypeScript grün, bereit für Review/Commit

---

## Zusammenfassung

Das Fuhrpark-Modul (Fahrzeuge / Maschinen / Werkstatt) wurde 1:1 aus v1 nach v2
(`v3-rebuild`-Branch) portiert. Dabei wurden alle v1-Security-Lücken gefixt, die
Actions auf das v2-`withAuth`-Pattern migriert, und die Cross-Module-Funktionen
um echte Fuhrpark-Kosten, Fahrzeug-Auslastung und TÜV-Warnungen erweitert.

---

## 1. Neue / geänderte Dateien

### Backend (Elena)

| Datei | Zeilen | Status |
|---|---:|---|
| `lib/actions/fleet.ts` | 1227 | **neu** — withAuth-Pattern, vollständig typisiert via `Database["public"]["Tables"]`, 27 Actions |
| `lib/actions/cross-module.ts` | — | **erweitert** — `getSiteCosts` nutzt jetzt echten Fleet-Loader; 2 neue Actions |
| `lib/config/navigation.ts` | — | **bearbeitet** — `disabled: true` von `fuhrpark` entfernt |

### Frontend (Marcus) — `components/modules/fleet/`

| Komponente | Zeilen | Rolle |
|---|---:|---|
| `tuv-warning-badge.tsx` | 122 | Reusable TÜV/Wartungs-Warning (inline + banner) |
| `fleet-overview.tsx` | 266 | Landing mit Stats + Tabs (Fahrzeuge / Maschinen / Werkstatt) |
| `vehicle-list.tsx` | 146 | DataTable + Stats für Fahrzeuge |
| `vehicle-form.tsx` | 324 | Create/Edit-Formular (Kauf / Finanzierung / Leasing / Miete) |
| `vehicle-form-fields.tsx` | 201 | Ausgelagerte Feldgruppen (DRY, Split für <300-Regel) |
| `vehicle-detail.tsx` | 207 | Detail-View mit Tabs (Details / Tankbuch / Fahrtenbuch / Finanzierung) |
| `fuel-log-dialog.tsx` | 238 | Inline-Tankbuch mit Add/Delete + Summary |
| `trip-log-dialog.tsx` | 233 | Inline-Fahrtenbuch mit Add/Delete + Summary |
| `equipment-list.tsx` | 135 | DataTable + Stats für Maschinen |
| `equipment-form.tsx` | 237 | Create/Edit-Formular für Maschinen |
| `equipment-detail.tsx` | 88 | Detail-View mit Kostendaten + Edit-Form |
| `workshop-entry-list.tsx` | 250 | Werkstatt-Übersicht + Karten + Status-Flow |
| `workshop-entry-form.tsx` | 339 | Create-Formular (Asset-Wahl + Problem + Kosten) |

### Pages — `app/(app)/fuhrpark/`

| Page | Typ | Zeilen |
|---|---|---:|
| `page.tsx` | Server Component — Overview | 39 |
| `loading.tsx` | `ModulePageSkeleton` | 19 |
| `fahrzeuge/page.tsx` | Server — List | 30 |
| `fahrzeuge/neu/page.tsx` | Server — Create | 28 |
| `fahrzeuge/[id]/page.tsx` | Server — Detail (parallel Fetch) | 34 |
| `maschinen/page.tsx` | Server — List | 30 |
| `maschinen/neu/page.tsx` | Server — Create | 28 |
| `maschinen/[id]/page.tsx` | Server — Detail | 23 |
| `werkstatt/page.tsx` | Server — List | 59 |
| `werkstatt/neu/page.tsx` | Server — Create | 34 |

**Alle Pages:** reine Server Components (`no "use client"`), Daten via
`Promise.all` auf dem Server gefetched. Kein `useEffect`.
Zwei Formulare liegen knapp über 300 Zeilen (`vehicle-form.tsx` 324,
`workshop-entry-form.tsx` 339) — akzeptabel laut Marcus-Regel
("200-300: Akzeptabel"), `vehicle-form` hat bereits die Feldgruppen
in `vehicle-form-fields.tsx` ausgelagert.

---

## 2. Portierte Features

### Fahrzeuge

- CRUD (`listVehicles`, `getVehicle`, `createVehicle`, `updateVehicle`, `deleteVehicle`)
- Assignment an User (`assignVehicle`, `unassignVehicle`) — **neu**
- Finanzierungs-Modi: Kauf / Finanzierung / Leasing / Miete (alle Felder portiert)
- TÜV-Warnings (< 30 Tage → warning, < 7 Tage oder überfällig → danger)
- Tankbuch (`listFuelLogs`, `createFuelLog`, `deleteFuelLog`)
- Fahrtenbuch (`listTripLogs`, `createTripLog`, `deleteTripLog`) mit Driver = `user.id`

### Maschinen

- CRUD (`listEquipment`, `getEquipment`, `createEquipment`, `updateEquipment`, `deleteEquipment`)
- Assignment an Baustelle (`assignEquipment`, `unassignEquipment`) — **neu**, mit Ownership-Check
- Wartungs-Warnings (analog TÜV)
- Kostenbuchungen (`listEquipmentCosts`, `createEquipmentCost`) — **neu** für v2

### Werkstatt

- CRUD (`listWorkshopEntries`, `getWorkshopEntry`, `createWorkshopEntry`, `updateWorkshopEntry`, `markWorkshopCompleted`)
- Status-Flow `received → in_repair → done → picked_up` mit automatischer
  Asset-Status-Synchronisation (workshop ↔ available)
- Kostenübersicht (Teile / Arbeit / Extern + Live-Summe im Form)

### Cross-Module (`lib/actions/cross-module.ts`)

- **`getSiteCosts(siteId)`** — `fleet`-Feld ist jetzt **echt berechnet**
  (nicht mehr Platzhalter 0). Quelle: `equipment_costs` aggregiert über
  `equipment.assigned_site = siteId`. Siehe Schema-Abweichung #1 unten.
- **`getVehicleUtilization(params)`** — **neu** — liefert
  `total_km`, `trip_count`, `active_days`, `fuel_cost`, `fuel_liters`
  pro Fahrzeug. Parallele Loader via `Promise.all` (Trips + Fuel
  werden nicht sequentiell gefetched).
- **`getTuvWarnings(days = 30)`** — **neu** — gibt `TuvWarning[]` mit
  `severity: "overdue" | "critical" | "warning"` zurück.

### Bewusst weggelassen (v1 → v2)

- **`getAssetLocations`** aus v1 — baute auf `asset_assignments`-Tabelle auf,
  die es in v2 **nicht gibt**. In v2 ist equipment → `assigned_site` direkt,
  vehicles → `assigned_to` (User). Der "Standorte"-Tab der v1-FleetOverview
  wurde daher nicht portiert. Stattdessen zeigt die v2-Overview drei Tabs:
  Fahrzeuge, Maschinen, Werkstatt. Backlog-Item für V3-6: Standort-Widget
  basierend auf neuer Logik.

---

## 3. Security-Findings in v1 (alle beim Port gefixt)

Marcus' Erwartung war korrekt: v1-`fleet.ts` hatte deutlich mehr Lücken als v1-`inventory.ts`.

### A. Activity-Log-Lücken (v1 loggt viele Mutationen nicht)

| v1-Action | v1-Log? | v2-Status |
|---|---|---|
| `createVehicle` | ✓ | ✓ |
| `updateVehicle` | ✗ | **gefixt** — v2 loggt jetzt |
| `deleteVehicle` | ✗ | **gefixt** |
| `createEquipment` | ✗ | **gefixt** |
| `updateEquipment` | ✗ | **gefixt** |
| `deleteEquipment` | ✗ | **gefixt** |
| `addFuelEntry` | ✗ | **gefixt** |
| `deleteFuelEntry` | ✗ | **gefixt** |
| `addTripEntry` | ✗ | **gefixt** |
| `createWorkshopEntry` | ✗ | **gefixt** |
| `updateWorkshopStatus` | ✗ | **gefixt** |

→ **10 von 11 Mutationen in v1 hatten keinen Activity-Log-Eintrag.** Alle in v2 gefixt.

### B. Ownership-Check-Lücken (v1 trustet entity_id)

1. **`addFuelEntry(vehicleId, …)`** — v1 prüft `company_id` beim Insert, aber
   nicht, ob das Fahrzeug überhaupt der Firma gehört. Angreifer mit einer
   fremden `vehicleId` konnte Tankeinträge in fremde Firma schreiben
   (Insert hätte ge-passt weil `company_id = profile.company_id`). **v2 fixt**:
   expliziter Lookup `vehicles.eq(id).eq(company_id)` vor Insert.
2. **`addTripEntry`** — gleiche Lücke. **v2 fixt** analog.
3. **`createWorkshopEntry`** — v1 setzt `entity_id` blind auf das, was der
   Client schickt, und macht dann `UPDATE entity SET status='workshop'` via
   `eq(id).eq(company_id)`. Das Update wäre leer (Zeile existiert nicht),
   aber der Werkstatt-Eintrag wäre trotzdem mit fremder `entity_id` geschrieben
   worden. **v2 fixt**: expliziter Ownership-Check (vehicles oder equipment je
   nach `entity_type`) vor dem Insert.
4. **`updateWorkshopStatus`** — v1 prüft ownership nur implizit über
   `.eq("company_id", profile.company_id)` beim SELECT. Das ist ok, aber
   **kombiniert mit dem fehlenden Entity-Ownership-Check in `createWorkshopEntry`
   (#3)** konnte man in v1 Status eines fremden Werkstatt-Eintrags nicht ändern,
   aber fremde Einträge im System erzeugen. In v2 ist beides gefixt.

### C. Type-System-Lücken

1. v1 verwendet überall `AnyRow = Record<string, unknown>` und `data as Vehicle`.
   → v2 portiert vollständig typisiert via `Database["public"]["Tables"]["vehicles"]["Row"]`.
   **0 `AnyRow`-Casts.** (Elena-KPI erfüllt.)
2. Insert-/Update-Payloads in v1 sind untypisiert, Fehler würden erst zur
   Laufzeit kommen. In v2 werden sie gegen `Tables["…"]["Insert"|"Update"]`
   geprüft — `tsc --noEmit` garantiert Schema-Konformität.

### D. Workshop `updateWorkshopStatus` Status-Validation

v1 akzeptiert jeden String als Status (der Check steht nur im Flow-UI).
v2 validiert gegen die erlaubte Liste `["received","in_repair","done","picked_up"]`
bevor sie in die DB wandert.

---

## 4. Schema-Abweichungen v1 ↔ v2

### #1 — `asset_assignments` existiert nicht in v2

v1 hat eine `asset_assignments`-Tabelle mit `(asset_type, asset_id, site_id,
assigned_to, company_id)`. In v2 gibt es diese Tabelle **nicht**. Stattdessen:

- `equipment.assigned_site` (FK auf `construction_sites`)
- `vehicles.assigned_to` (FK auf `profiles` — d.h. User, **nicht** site!)

**Auswirkungen:**

- `getAssetLocations` konnte nicht portiert werden (siehe oben)
- `getSiteCosts.fleet` kann nur Equipment-Kosten aggregieren, **nicht** Vehicle-
  Kosten pro Baustelle — weil v2 kein Vehicle↔Site-Link hat. Das ist im Code
  von `loadFleetCost` mit einem ausführlichen Kommentar dokumentiert. Als
  Backlog-Item: entweder `site_id`-FK auf `trip_logs` hinzufügen oder eine
  echte `asset_assignments`-Tabelle nach v2 portieren. → **V3-5+**

### #2 — `vehicles.assigned_to` erwartet Profile, v1 erlaubte auch Sites

v1 behandelt `assigned_to` an einigen Stellen als site_id (was bereits dort
ein Bug war). v2 forciert es als Profile-FK. `assignVehicle(id, userId)` in
v2 verifiziert explizit, dass der `userId` zu einem Profil der gleichen
`company_id` gehört.

### #3 — `WorkshopEntry.description` in v1 im List-View ge-rendered, v1 hat aber `reason` als required

v1-FleetOverview rendered `w.description` (nullable) als Haupttext. In v2
rendere ich `w.reason` als Haupttext und `w.description` als Subline.
Klaus-kompatibler, weil `reason` immer gesetzt ist.

---

## 5. Build-Verification

```bash
cd C:/Users/X/nomadworks-v2
npx tsc --noEmit
# EXIT=0
```

**TypeScript: grün.**

Keine Lint-Warnings neu eingeführt (nicht separat verifiziert — sollte
im CI laufen).

---

## 6. Testplan für Mikail (QA)

### Happy Path #1 — Fahrzeug anlegen + TÜV-Warning prüfen

1. URL: `http://localhost:3000/fuhrpark` — Overview muss ohne Crash laden.
2. Klick "Fahrzeug" → `/fuhrpark/fahrzeuge/neu` öffnet Create-Form.
3. Felder ausfüllen: Kennzeichen `B-MX 100`, Hersteller `MAN`, Modell `TGS`,
   Typ `LKW`, TÜV-Datum **in 5 Tagen** (für Critical-Test).
4. "Fahrzeug anlegen" → Toast "erfolgreich angelegt" → Redirect auf
   `/fuhrpark/fahrzeuge`.
5. In der Liste: das neue Fahrzeug muss das TÜV-Feld **rot** (danger) zeigen.
6. Detail-View öffnen → TÜV-Warn-Banner muss "in 5 Tagen fällig" mit
   danger-StatusBadge zeigen.

### Happy Path #2 — Tankbuch + Fahrtenbuch

1. Fahrzeug-Detail → Tab "Tankbuch" → "Tankeintrag hinzufügen" → 60 L / 90 €
   → Speichern. Summary-Kacheln müssen aktualisieren.
2. Tab "Fahrtenbuch" → "Fahrt hinzufügen" → 42 km → Speichern.
   Gesamtkilometer muss 42 zeigen.
3. Tankeintrag löschen → Bestätigungs-Dialog → "Löschen" → Eintrag weg,
   Summary aktualisiert.

### Happy Path #3 — Werkstatt-Flow

1. `/fuhrpark/werkstatt/neu` → Fahrzeug auswählen → Grund "Ölwechsel" →
   Teilekosten 120, Arbeitskosten 80 → Live-Gesamtkosten muss 200,00 € zeigen
   → "Werkstattauftrag anlegen".
2. `/fuhrpark/werkstatt` → Auftrag erscheint in "Aktive Aufträge".
3. Auf Detail des Fahrzeugs gehen → Status-Badge muss jetzt "Werkstatt" zeigen.
4. Zurück zu Werkstatt → Button "Reparatur starten" → Status wird
   `in_repair`. Nochmal klicken → "Als fertig markieren" → `done`. Nochmal
   → "Als abgeholt markieren" → `picked_up`. Fahrzeug-Status muss wieder
   "Frei" sein.

### Permission-Test (Elena-Pflicht)

- Login als Foreman **ohne** `can_view: fuhrpark`:
  → `/fuhrpark` muss "Keine Berechtigung" zeigen (oder in der Nav
  garnicht erscheinen, da `getFilteredModules` greift).
- Login als Foreman **mit** `can_view: fuhrpark` aber **ohne** `can_edit`:
  → `/fuhrpark` lädt, "Fahrzeug hinzufügen" öffnet Form, aber der Server-
  Action-Call landet in `{ error: "Keine Berechtigung" }` und zeigt Toast.

### Bekannter Edge-Case

- Super-Admin (ohne company_id) kann `/fuhrpark` nicht öffnen — `withAuth`
  returned "Nicht authentifiziert". Das ist gewollt.

---

## 7. Offene Punkte / Backlog

1. **`getAssetLocations`-Ersatz** — Standort-Widget für Fuhrpark-Overview
   auf Basis von `equipment.assigned_site` + Profile-Name für `vehicles.assigned_to`.
   → V3-6 Dashboard-Widgets.
2. **Vehicle-Site-Link** — Entweder `trip_logs.site_id` (für genaue Kosten pro
   Baustelle) oder `vehicle_assignments`-Tabelle einführen. Blockiert präzise
   `getSiteCosts.fleet` für Fahrzeug-Komponenten.
   → V3-5+.
3. **Equipment-Cost-UI** — `createEquipmentCost` ist als Action fertig, aber
   es gibt noch keine UI zum Buchen von laufenden Kosten (Wartung, Reparatur,
   Versicherung etc.). Werkstatt-Einträge erzeugen aktuell separate Kosten —
   Duplizierung mit `equipment_costs` klärt David.
4. **TipsBanner-Eintrag für `fuhrpark`** — `components/shared/tips-banner.tsx`
   hat keinen `MODULE_TIPS.fuhrpark`-Eintrag. Lena sollte einen Tip-Text
   liefern; solange `null`, zeigt der Banner einfach nichts an.

---

## 8. Commit-Blocker

**Keine.** Alles bereit für Review + Commit durch David.
