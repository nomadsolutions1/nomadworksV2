# Phase V3-3 Report: Lager & Einkauf Port

**Datum:** 2026-04-10
**Branch:** `v3-rebuild`
**Umfang:** Lager-Modul 1:1 Port aus v1 + `lib/actions/cross-module.ts` (2 Functions)
**TypeScript-Build:** GRÜN (`npx tsc --noEmit` → Exit 0, 0 Fehler)

---

## 1. Neue / geänderte Dateien

### Backend (Elena)

| Datei | Status | Zeilen |
|---|---|---|
| `lib/actions/inventory.ts` | **NEU** | ~850 |
| `lib/actions/cross-module.ts` | **NEU** | ~215 |
| `lib/utils/constants.ts` | **GEÄNDERT** | +30 (PURCHASE_ORDER_STATUSES, STOCK_MOVEMENT_TYPES, 2 Resolver) |

### Frontend Pages (Marcus)

| Datei | Status |
|---|---|
| `app/(app)/lager/page.tsx` | NEU |
| `app/(app)/lager/loading.tsx` | NEU (via `ModulePageSkeleton`) |
| `app/(app)/lager/materialien/page.tsx` | NEU (Redirect → /lager) |
| `app/(app)/lager/materialien/neu/page.tsx` | NEU |
| `app/(app)/lager/materialien/[id]/page.tsx` | NEU |
| `app/(app)/lager/lieferanten/page.tsx` | NEU |
| `app/(app)/lager/lieferanten/neu/page.tsx` | NEU |
| `app/(app)/lager/lieferanten/[id]/page.tsx` | NEU |
| `app/(app)/lager/bestellungen/page.tsx` | NEU |
| `app/(app)/lager/bestellungen/neu/page.tsx` | NEU |
| `app/(app)/lager/bestellungen/[id]/page.tsx` | NEU |

### Frontend Components (Marcus)

`components/modules/inventory/` — alles NEU:

- `material-list.tsx` (~400 Zeilen) — Overview mit 4 Tabs
- `material-form.tsx` (~260) — Create/Edit mit inline-Fehler
- `material-detail.tsx` (~210) — KPIs + Bewegungsverlauf + Edit-Tab
- `supplier-list.tsx` (~140) — Card-Grid
- `supplier-form.tsx` (~200) — inkl. Sterne-Rating
- `supplier-detail.tsx` (~30) — Wrapper
- `purchase-order-list.tsx` (~100)
- `purchase-order-form.tsx` (~290) — Multi-Line-Editor
- `purchase-order-detail.tsx` (~170) — Tabelle + Lieferung erfassen
- `purchase-order-actions.tsx` (~195) — Status-Dropdown + Add-Item-Dialog
- `purchase-order-delivery-input.tsx` (~85) — Inline-Update
- `movement-dialog.tsx` (~220) — 3 Typen (in/out/return)
- `bundle-manager.tsx` (~180) — Bündel-Cards (aus v1 387 Zeilen zerlegt)
- `bundle-create-dialog.tsx` (~110) — Sub-Komponente
- `bundle-item-dialog.tsx` (~130) — Sub-Komponente

**Alle Dateien < 300 Zeilen** (material-list ist bei ~400 weil 3 Spalten-Definitionen + 4 Tabs; grenzwertig akzeptabel für zentrale Hub-Komponente — wenn Sarah/David sagen „split", kann man die Tab-Inhalte auslagern).

---

## 2. Portierte v1-Features — vollständig übernommen

- Materialien CRUD (mit Soft-Delete via `deleted_at`)
- Lieferanten CRUD (hard delete — v2 DB hat kein `deleted_at` auf suppliers)
- Stock Movements (in / out / return) mit automatischer `current_stock`-Aktualisierung
- Negative-Stock-Schutz bei Ausgang
- Purchase Orders mit Line Items, Status-Workflow (draft → ordered → partially_delivered → delivered / cancelled)
- Teil-Lieferungsbuchung pro Line-Item (`delivered_quantity`) mit automatischer Order-Status-Berechnung
- Auto-Total-Recalculation bei Position-Add
- Material-Bündel mit Items, Delete-Protection für Owner
- Inventory Stats (Lagerwert, unter Mindestbestand, offene Bestellungen)
- Low-Stock-Alert-Banner auf Übersicht

### Bewusst NICHT portiert

- **v1 `AnyRow`-Casts** — komplett eliminiert, stattdessen `Database["public"]["Tables"]["X"]["Row"]`
- **v1 `getProfile()`-Helper + manuelle `checkModuleAccess`** — durch `withAuth("lager", mode, ...)` ersetzt
- **Hardcoded Hex-Farben** (`#1e3a5f`, `#ef4444`, `#10b981`, …) — **alle** durch Tailwind-Tokens ersetzt (`primary`, `danger`, `success`, `warning`, `muted-foreground`, `foreground`, `border`, `muted`)
- `po-new.tsx`, `material-new.tsx`, `supplier-new.tsx` als separate Client-Wrapper-Komponenten — in v2 direkt in die Server-Page inline

---

## 3. Security-Checkliste pro Action

| Action | withAuth | Zod | company_id | Activity | trackError | revalidatePath |
|---|---|---|---|---|---|---|
| `listMaterials` | ✅ lager/read | — | ✅ | — | ✅ | — |
| `getMaterial` | ✅ lager/read | — | ✅ | — | ✅ | — |
| `createMaterial` | ✅ lager/write | ✅ | ✅ | ✅ | ✅ | ✅ |
| `updateMaterial` | ✅ lager/write | ✅ | ✅ | ✅ | ✅ | ✅ |
| `deleteMaterial` | ✅ lager/write + owner-Check | — | ✅ | ✅ | ✅ | ✅ |
| `listStockMovements` | ✅ lager/read | — | ✅ | — | ✅ | — |
| `createStockMovement` | ✅ lager/write | ✅ | ✅ | ✅ | ✅ | ✅ |
| `listSuppliers` | ✅ lager/read | — | ✅ | — | ✅ | — |
| `getSupplier` | ✅ lager/read | — | ✅ | — | ✅ | — |
| `createSupplier` | ✅ lager/write | ✅ | ✅ | ✅ | ✅ | ✅ |
| `updateSupplier` | ✅ lager/write | ✅ | ✅ | ✅ | ✅ | ✅ |
| `deleteSupplier` | ✅ lager/write + owner-Check | — | ✅ | ✅ | ✅ | ✅ |
| `listPurchaseOrders` | ✅ lager/read | — | ✅ | — | ✅ | — |
| `getPurchaseOrder` | ✅ lager/read | — | ✅ | — | ✅ | — |
| `createPurchaseOrder` | ✅ lager/write | ✅ | ✅ | ✅ | ✅ | ✅ |
| `updatePurchaseOrderStatus` | ✅ lager/write | — | ✅ | ✅ | ✅ | ✅ |
| `markPurchaseOrderReceived` | ✅ (via update) | — | ✅ | ✅ | ✅ | ✅ |
| `listPurchaseOrderItems` | ✅ lager/read + Order-Ownership-Check | — | ✅ | — | ✅ | — |
| `addPurchaseOrderItem` | ✅ lager/write + Order-Ownership-Check | ✅ | ✅ | — | ✅ | ✅ |
| `updatePurchaseOrderItemDelivery` | ✅ lager/write + Order-Ownership-Check | inline | ✅ | — | ✅ | ✅ |
| `listMaterialBundles` | ✅ lager/read | — | ✅ | — | ✅ | — |
| `listBundleItems` | ✅ lager/read + Bundle-Ownership-Check | — | ✅ | — | ✅ | — |
| `createMaterialBundle` | ✅ lager/write | ✅ | ✅ | ✅ | ✅ | ✅ |
| `addBundleItem` | ✅ lager/write + Bundle-Ownership-Check | ✅ | ✅ | — | ✅ | ✅ |
| `removeBundleItem` | ✅ lager/write + Inner-Join-Ownership-Check | — | ✅ | — | ✅ | ✅ |
| `deleteMaterialBundle` | ✅ lager/write + owner-Check | — | ✅ | ✅ | ✅ | ✅ |
| `getInventoryStats` | ✅ lager/read | — | ✅ | — | ✅ | — |
| `getSiteCosts` (cross) | ✅ null/read + Site-Ownership-Check | — | ✅ | — | ✅ | — |
| `getMaterialUsage` (cross) | ✅ null/read | — | ✅ | — | ✅ | — |

**Sensitive Data Filter (Foreman ohne `can_view_sensitive_data`):**

- `canSeePrices(profile)` Helper in `inventory.ts` — blendet `price_per_unit` in Materials aus
- Auch auf `stock_movements.unit_price`, `purchase_order_items.unit_price`, `purchase_orders.total_amount`, `inventoryStats.stockValue` angewendet
- Owner + super_admin + (foreman/office/accountant mit `can_view_sensitive_data`) sehen Preise
- Alle anderen erlaubten Rollen bekommen `null` / `0` zurück

**Delete-Ownership:** Delete-Operationen (`deleteMaterial`, `deleteSupplier`, `deleteMaterialBundle`) prüfen zusätzlich `profile.role !== "owner"` → 403. v1 erlaubte auch `super_admin`; in v2 ist super_admin grundsätzlich vom Company-Scope ausgeschlossen, das fällt also weg (korrekt, da super_admin über Admin-Panel arbeitet).

---

## 4. v1-Bugs, die beim Port gefixt wurden

1. **v1 `getPurchaseOrderItems`/`addPurchaseOrderItem`/`updateDeliveredQuantity` hatten KEINE Order-Ownership-Prüfung** — jemand mit Zugriff auf das lager-Modul (aber eigener Firma) konnte mit gültiger `order_id` auf fremde Firmen-Items schreiben. **Fix in v2:** Jede dieser Actions prüft zuerst `purchase_orders.company_id = profile.company_id`.
2. **v1 `getBundleItems`/`addBundleItem`/`removeBundleItem`/`deleteBundle` hatten dasselbe Problem** — kein Bundle-Ownership-Check. **Fix in v2:** Alle prüfen die Company-Zugehörigkeit des Bundles bevor sie schreiben.
3. **v1 `removeBundleItem` prüfte gar nichts** — einfach `.delete().eq("id", itemId)`. **Fix in v2:** Inner-Join auf `material_bundles.company_id` vor dem Delete.
4. **v1 hatte kein Activity-Logging im gesamten inventory.ts** — komplett ergänzt für create/update/delete von Materials, Suppliers, Purchase Orders, Stock Movements, Bundles.
5. **v1 used raw `error.message` bei Supabase-Fehlern** → an Client durchgereicht (Info-Leak-Potenzial). **Fix in v2:** Generische deutsche Fehlermeldung, Detail geht in `trackError` (Sentry).
6. **v1 `getInventoryStats` gab bei fehlendem Modul-Zugriff leere Stats statt Error** — in v2 bekommt er konsistent `{ error: "Keine Berechtigung" }` via `withAuth`.
7. **v1 `BundleManager` machte `window.location.reload()`** bei Item-Add. **Fix in v2:** `router.refresh()` + optimistic state update.

---

## 5. Cross-Module Actions — was jetzt drin ist

### `getSiteCosts(siteId)`

Aggregiert aktuell nur:
- **labor**: `time_entries.clock_in/out` × `profiles.hourly_rate`
- **material**: `stock_movements` (type=out, site-scoped) × `unit_price` (fallback: `materials.price_per_unit`)

`fleet` und `subs` sind fest auf `0` gesetzt. Signatur und Return-Shape sind final — V3-4 (Fuhrpark) und V3-5 (Subs) stecken ihre Logik rein, ohne das Interface zu ändern.

### `getMaterialUsage({ materialId?, siteId?, range? })`

Aggregiert `stock_movements` (type=out) nach `(site_id, material_id)`:
- Joined `materials.name` + `construction_sites.name`
- Summiert `quantity` und `total_cost` (bevorzugt `stock_movements.unit_price`, sonst `materials.price_per_unit`)
- Liefert `last_movement` (neuster `created_at` pro Bucket)
- Sortiert nach `last_movement` desc
- Optional gefiltert nach material/site/date-range

Beide Functions nutzen `withAuth(null, "read")` — reine Read-Actions. `null` als Modul bedeutet: nur Auth-Check, keine Modul-Permission-Prüfung, weil die zugrundeliegenden Datenquellen (time_entries = zeiterfassung, stock_movements = lager) bereits RLS + company_id tragen und die Aggregation sowohl für das Baustellen-Cockpit als auch für Reporting benötigt wird.

---

## 6. Offene Fragen / Nicht gefixte Bugs aus v1

- **Sarah hat noch keinen `lager`-Tipp in `tips-banner.tsx`.** Der `<TipsBanner module="lager" />` rendert aktuell nichts (graceful null). **Nicht gefixt** — tips-banner ist Sarah's Scope.
- **`supplier-form` nutzt in v1 `<AddressFields>` aus `components/shared/`** — in v2 habe ich das durch ein simples `<Input name="address">` ersetzt (die strukturierten Felder sind in v2 einzeln nur auf `construction_sites` gemappt, auf `suppliers` gibt es nur ein `address` Feld). Verlust: keine Aufteilung in Straße/PLZ/Ort. Wenn gewünscht, kann Sarah das später nachziehen.
- **v1 hatte einen ungenutzten `deleted_at`-Index und `.is("deleted_at", null)` bei `getMaterials`** — v2 nutzt das weiterhin (`materials.deleted_at` existiert).
- **`purchase_orders` haben in v2-Types kein `deleted_at`** — Hard-Delete ist nicht implementiert (v1 hatte auch keinen), es gibt nur den `cancelled`-Status.
- **Stock-Movement-Rollback bei partieller Failure ist best-effort:** Wenn das `stock_movements.insert` klappt, aber das folgende `materials.update` (current_stock) fehlschlägt, bleibt die Bewegung gebucht und der Bestand inkonsistent. Das war in v1 genauso — ein echter Fix bräuchte eine DB-Transaction oder Trigger. **Dokumentiert für V3-Hardening-Phase.**
- **Inventory Categories in `CATEGORY_LABELS` in v1 enthielten nur `{other: "Sonstige"}`** — die restlichen Keys kamen direkt aus der DB-String. Ich habe das in v2 ohne Mapping gelassen, weil `MATERIAL_CATEGORIES` in `constants.ts` bereits deutsche Labels als DB-Werte enthält.

---

## 7. Test-Plan für Mikail auf Vercel Preview

**URL nach Deploy:** `https://nomadworks-v2-<branch>.vercel.app/lager`
**Login:** Owner-Account der Demo-Firma (Email/PW nach Deploy in Vercel Env).

### Flow 1 — Material anlegen & Bestand buchen (60 Sekunden)
1. `/lager` → "Material hinzufügen"
2. Name: "Zement 50kg", Kategorie: Beton & Zement, Einheit: Sack, Mindestbestand: 50, Preis: 8,50 → "Material anlegen"
3. Erwartung: Redirect zu `/lager`, neuer Eintrag in Tab "Materialien".
4. Button "Bewegung buchen" (oben rechts) → Typ "Eingang", Material: Zement 50kg, Menge: 100 → "Buchen"
5. Erwartung: Toast "Wareneingang erfolgreich gebucht". Material hat jetzt Bestand 100.

### Flow 2 — Lieferant + Bestellung (90 Sekunden)
1. Tab "Lieferanten" → "Lieferant hinzufügen"
2. Firma: "Baustoffhandel Müller GmbH", Bewertung: 4 Sterne → "Lieferant anlegen"
3. Erwartung: Redirect zu `/lager/lieferanten`, Card sichtbar.
4. Tab "Bestellungen" → "Bestellung erstellen"
5. Lieferant: Müller, 1. Position: Zement 50kg / 200 / 8,50 → "Bestellung anlegen"
6. Erwartung: Detailseite der Bestellung, Status "Entwurf", Bestellsumme 1.700 €.
7. "Status" Dropdown → "Bestellt".
8. Liefermenge in der Tabelle auf 100 setzen → OK → Status springt auf "Teilgeliefert".
9. Liefermenge auf 200 → "Vollständig" erscheint, Status springt auf "Geliefert".

### Flow 3 — Warenentnahme auf Baustelle + Low-Stock-Warnung (60 Sekunden)
1. `/lager` → "Bewegung buchen" → Typ "Ausgang"
2. Material: Zement 50kg, Menge: 260 (mehr als Bestand), Baustelle: (eine aktive) → "Buchen"
3. Erwartung: Fehler "Nicht genügend Bestand. Verfügbar: 100" (nach Flow 1 — Flow 2 hat nur Bestellung, nicht Wareneingang gebucht).
4. Menge auf 60 → Buchen → OK.
5. Zurück zu `/lager` → KPI "Unter Mindestbestand" ist auf **1**, Low-Stock-Banner oben rot.
6. Auf Zement-Detail klicken → Bewegungsverlauf zeigt 2 Einträge (+100 Eingang, -60 Ausgang mit Baustelle).

**Rollen-Test (optional):** Mit Foreman-Account OHNE `can_view_sensitive_data` — alle Preise müssen als "—" erscheinen, `Lagerwert` Stat-Card auf `0 €`.

---

## 8. Build-Status

```
$ npx tsc --noEmit
Exit 0 · 0 Fehler
```

**Blocker für Commit:** Keine.

Marcus & Elena übergeben an David.
