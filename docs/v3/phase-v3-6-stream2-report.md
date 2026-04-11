# Phase V3-6 — Stream 2 Report

**Owner:** Elena Petrov + Lena Fischer
**Scope:** Legacy-Exports (SOKA-Bau, DATEV) und Auftrags-Nachträge
**Branch:** `v3-rebuild`
**Status:** Done (alle drei Features funktionsfähig)

## Feature A — SOKA-Bau CSV/PDF Export — Done

### v1 vs. v2 Bestandsaufnahme
- `getSokaCalculations(month)` und `exportSokaCSV(month)` waren in v2 bereits vorhanden und entsprachen 1:1 der v1-Logik (Urlaubs-/Berufsbildungs-/Rente-Umlage mit Fallback auf Standardsätze 14.3 / 2.6 / 3.4, Brutto aus Monatsgehalt oder Stundensätze × Zeiteinträge).
- v2 hatte den Sicherheits-Fix gegenüber v1 bereits (withAuth("mitarbeiter","read") statt ungeprüfter requireCompanyAuth).
- Die bestehende `app/(app)/firma/soka-export/page.tsx` war aber die reine Druck-Ansicht — es fehlte komplett die UI mit Monatsfilter und Download-Buttons. Auch `exportSokaPDF` fehlte.

### Portiert / Erweitert
- `lib/actions/soka.ts`: neue Action `exportSokaPDF(month)` liefert Druck-fertiges HTML (DOCTYPE, @page A4, inline-styles). Nutzt denselben `withAuth("mitarbeiter","read")`-Rahmen wie die Calculation-Action.
- `lib/actions/soka.ts`: `exportSokaCSV` nutzt jetzt die neue `lib/utils/datev.ts`-Helper (BOM + CRLF + Komma-Dezimal + Escaping).
- `app/(app)/firma/soka-export/page.tsx`: komplette UI — Monat-Picker, Vorschau-Tabelle, CSV-Download-Button, Link zur Druck-Seite. Server-Component rendert Daten, Client-Component `SokaExportClient` handelt Interaktionen (Month-Change, CSV-Download via Blob).
- `app/(app)/firma/soka-export/drucken/page.tsx` (neu): 1:1 die alte Print-Ansicht (A4, @media print, Signatur-Block). Print-Button in `components/modules/company/soka-print-button.tsx` ausgelagert (Client-Component).
- `components/modules/company/soka-export-client.tsx` (neu): UI für Monat-Picker + Downloads.

### Neue Dateien
- `lib/utils/datev.ts`
- `components/modules/company/soka-export-client.tsx`
- `components/modules/company/soka-print-button.tsx`
- `app/(app)/firma/soka-export/drucken/page.tsx`

## Feature B — Steuerberater (Accountant) Export — Done

### v1 vs. v2 Bestandsaufnahme
- `updateAccountantPermissions(accountantIdOrEmpty, mode)` existiert bereits in v2 (`lib/actions/settings.ts`) mit den beiden Modi `accounting` (Rechnungen + Bautagesbericht + Mitarbeiter) und `full` (Voller Lesezugriff).
- `getTaxAdvisorSettings` / `updateTaxAdvisorSettings` und `TaxAdvisorForm` mit Modus-Auswahl-Karten (Klaus-konforme UI) sind vorhanden.
- `canRoleAccessModule` in `auth-helper.ts` berücksichtigt `accountant` bereits in einer Zeile mit `foreman` und `office`, und `filterSensitiveData` erlaubt Accountants mit `can_view_sensitive_data` sensible Felder zu sehen — Defense-in-Depth ist also korrekt verdrahtet.
- v1 hatte **keinen DATEV-Export** — das war eine Neu-Implementation in v3.

### Gebaut
- `lib/utils/datev.ts` (Helper für DATEV-konformes CSV: Semikolon-Trennung, Komma-Dezimal, CRLF, BOM, Escape-Regeln).
- `lib/actions/soka.ts`: neue Action `exportDatevTimeEntries(from, to)` — lädt time_entries im Zeitraum, resolved Mitarbeiter-Namen + Baustelle + Stundensatz, rechnet Brutto pro Eintrag, liefert DATEV-CSV. Auth: `withAuth("mitarbeiter","read")`. Validation: ISO-Datum + Start ≤ Ende. Activity-Log auf `export`.
- `lib/actions/invoices.ts`: neue Action `exportInvoicesDatev(from, to)` — lädt alle Rechnungen im Zeitraum inkl. Kundennummer/-name als Join-Map, liefert DATEV-CSV mit Netto / USt-Satz / USt-Betrag / Brutto / Bezahlt / Zahlungsdatum. Auth: `withAuth("rechnungen","read")`. Activity-Log auf `export`.
- `app/(app)/firma/steuerberater/page.tsx` (neu): Konfigurations-Seite — zeigt `TaxAdvisorForm` (bestehend) + neue Karte "DATEV-Export" mit Datumswahl und zwei Download-Buttons. Owner + super_admin only, sonst Redirect auf `/firma`.
- `components/modules/company/datev-export-client.tsx` (neu): Client-Component mit zwei Datumsfeldern und Download-Buttons (Blob-Download, Toast-Feedback, Lena-Texte).

### Accountant-Zugriff — Defense in Depth
| Ebene | Mechanismus |
|---|---|
| Proxy (Routing) | `canRoleAccessModule` erlaubt `accountant` mit korrekter `foreman_permissions`-Zeile |
| Server Action | `withAuth` prüft `checkModuleAccess` → lädt Permissions aus der DB |
| Database | company_id-Filter in jeder Query |

Keine neue Funktion nötig, aber die neuen DATEV-Exports nutzen genau diesen Pfad: Ein Accountant mit Leserecht auf `rechnungen` / `mitarbeiter` kann exportieren, ohne dass wir role-spezifischen Code schreiben mussten.

## Feature C — Auftrags-Nachträge (Change Orders) — Done

### Bestandsaufnahme
- **Schema-Check:** v2 nutzt nicht eine separate `order_addendums`-Tabelle, sondern das v1-Pattern "Notes-Log": `orders.original_budget` + `orders.change_order_notes` (beides bereits in `database.ts` typisiert).
- `lib/actions/orders.ts::addChangeOrder(orderId, description, amount)` ist vollständig implementiert: withAuth-Scoping, Zod (`changeOrderSchema`), `original_budget`-Fallback bei erstem Nachtrag, Notes-Log chronologisch, Activity-Log, revalidatePath.
- `components/modules/orders/order-overview-tab.tsx` hat bereits Button + Dialog + Display-Card ("Budget & Nachträge" mit Original-Budget, Nachträge-Log, aktuelles Budget).

### Ergebnis
Feature ist bereits in v3 1:1 funktional. **Keine Codeänderung nötig.**

### Schema-Backlog (optional)
Falls später einzelne Nachträge als Records gebraucht werden (z.B. Löschen/Editieren eines spezifischen Nachtrags, Verknüpfung mit Nachtrags-Rechnungen), wäre eine `order_addendums`-Tabelle nötig. **Kein Blocker** für Stream 2, da das v1-Pattern ausreicht.

## Test-Plan

### SOKA-Bau Export
1. Als Owner einloggen, zu `/firma/soka-export` navigieren.
2. Aktueller Monat ist vorausgewählt. Monat wechseln → Seite reloadet mit neuem Monat in URL.
3. Vorschau-Tabelle zeigt Mitarbeiter mit Bruttolohn, Urlaub %, Berufsbildung %, Rente %, Gesamt.
4. "CSV herunterladen" klicken → Blob-Download `SOKA-Bau_YYYY-MM.csv` mit BOM + CRLF + `;`-Trennung.
5. CSV in Excel öffnen → Zahlen werden als Währung erkannt, Umlaute korrekt.
6. "Drucken / PDF" klicken → neue Tab mit `/firma/soka-export/drucken?month=...`.
7. Print-Dialog prüfen: A4, eine Seite, Signatur-Block unten.
8. Edge-Case: Monat ohne Löhne → Empty State "Keine Löhne in diesem Monat" mit Hilfetext statt leerer Tabelle.
9. Accountant (Role=accountant) mit Lese-Permission auf "mitarbeiter" kann exportieren, ohne Permission → `Keine Berechtigung`.

### Steuerberater / DATEV
1. Als Owner zu `/firma/steuerberater` navigieren.
2. Stammdaten speichern (Name/Kanzlei/Email/Tel) → Toast "Steuerberater-Daten gespeichert".
3. Modus-Auswahl wechseln → "Zugriffsrechte speichern" → prüft Permissions-Map für den Accountant-Account in `foreman_permissions`.
4. DATEV-Export: Zeitraum wählen, "Rechnungen (DATEV-CSV)" klicken → Download `DATEV_Rechnungen_YYYY-MM-DD_bis_YYYY-MM-DD.csv`. Datei in Editor öffnen → Semikolon-Trennung, Komma-Dezimal, CRLF (\r\n).
5. "Zeiten (DATEV-CSV)" klicken → Download mit Datum / Mitarbeiter / Baustelle / Beginn / Ende / Pause / Stunden / Stundensatz / Betrag.
6. Ungültiger Zeitraum (to < from) → Toast "Startdatum liegt nach dem Enddatum."
7. Als Worker/Employee direkt `/firma/steuerberater` aufrufen → Redirect zu `/firma`.
8. Als Accountant mit Lese-Permission auf rechnungen → Export-Action liefert Daten; Lese-Permission auf mitarbeiter → Zeit-Export funktioniert.

### Nachträge
1. Auftrag öffnen → Overview-Tab → "Nachtrag"-Button oben rechts in "Budget & Nachträge".
2. Dialog: Beschreibung + Betrag eingeben → "Nachtrag hinzufügen".
3. Liste zeigt Original-Budget (unverändert), Nachträge-Log mit `[TT.MM.JJJJ]: Beschreibung (+X.XXX,XX €)`, aktuelles Budget = Original + Summe Nachträge.
4. Zweiten Nachtrag anlegen → Notes werden angehängt, Budget steigt.
5. Als Foreman ohne Write-Recht auf "auftraege" → Action liefert "Keine Berechtigung", Button-Klick zeigt Toast.
6. Validation: Betrag 0 oder negativ → "Ungültige Eingabe: Beschreibung und positiver Betrag erforderlich".

## Sicherheits-Checkliste (Elena)

| Action | withAuth | Zod / Validation | company_id | Activity-Log |
|---|---|---|---|---|
| `getSokaCalculations` | mitarbeiter/read | month-regex implizit | ✓ | — (read) |
| `exportSokaCSV` | via get-call | ✓ | ✓ | — (read) |
| `exportSokaPDF` (neu) | mitarbeiter/read | ✓ | ✓ | — (read) |
| `exportDatevTimeEntries` (neu) | mitarbeiter/read | ISO-Regex + Range | ✓ | ✓ export |
| `exportInvoicesDatev` (neu) | rechnungen/read | ISO-Regex + Range | ✓ | ✓ export |
| `addChangeOrder` (bestehend) | auftraege/write | Zod-Schema | ✓ | ✓ update |

## TypeScript
`npx tsc --noEmit` → green (keine Fehler).

## Offene Punkte / Kein Blocker
- DATEV-Format ist aktuell ein **generischer CSV-Export**, nicht das formale "EXTF"-Format mit Versionszeile. Für Basis-Import in DATEV Rechnungswesen ausreichend; falls Klaus' Steuerberater die strikte EXTF-Header-Variante braucht, ist das eine Schema-Ergänzung in `buildDatevCsv` (zusätzliche Header-Zeile) — nicht für MVP nötig.
- `exportSokaPDF` liefert HTML-String (nicht Binary-PDF). Echter PDF-Download kann clientseitig per Browser "Als PDF drucken" oder serverseitig per Playwright erfolgen — kein Blocker, die Print-Seite ist bereits gedruckt-optimiert.
