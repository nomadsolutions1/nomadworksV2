# Phase V3-6 — Stream 3 Report

**Scope:** Disposition-Wochenplanung + Bautagesbericht Druck-Layout + Foto-Upload
**Agent:** Marcus Weber + Elena Petrov
**Branch:** `v3-rebuild`

## Geänderte / neue Dateien

### Disposition (Feature A)
- `components/modules/disposition/week-grid.tsx` — "Woche planen"-Button ergänzt, `weekStart` + `startInBulkMode` an AssignmentDialog durchgereicht.
- `components/modules/disposition/assignment-dialog.tsx` — neue Prop `startInBulkMode` (optionaler Bulk-Einstiegspunkt).

### Bautagesbericht (Feature B)
- `lib/actions/diary.ts` — neuer Typ `DiaryPhoto`, neue Server Actions `getDiaryPhotos`, `uploadDiaryPhoto`, `deleteDiaryPhoto` inkl. Supabase-Storage-Handling, Rollback, Activity-Log, Ownership-Check via Company-scoped Join.
- `components/modules/diary/photo-upload.tsx` — neu, Foto-Grid, Upload, Lightbox, Delete, Pflichthinweise (max 10, max 5 MB, jpeg/png/webp).
- `components/modules/diary/diary-detail.tsx` — Foto-Card integriert, zusätzlicher Drucken-Button im Header.
- `app/(app)/bautagesbericht/[id]/page.tsx` — lädt Photos parallel mit Documents.
- `app/(app)/bautagesbericht/[id]/drucken/page.tsx` — erweitertes Druck-Layout (12 px Basis, Arbeitszeit-Tabelle, Foto-Grid mit page-break, drei Unterschrift-Slots).
- `app/(app)/bautagesbericht/[id]/drucken/print-button.tsx` — neu, Client-Komponente für `window.print()`.

## v1-Features portiert / weggelassen

### Portiert
- **Wochenplanung (d30cb0d4 / f6c56267):** Über AssignmentDialog-Bulk-Mode + neuer "Woche planen"-Einstiegspunkt in der WeekGrid. Vorhandene `bulkCreateAssignments`-Action wird genutzt.
- **Tagesansicht (b3b2ab6e):** War bereits in v2 vorhanden (`day-view.tsx`, `timeline-view.tsx`) — Tab "Tagesansicht" + Timeline im `disposition-content.tsx` aktiv.
- **Uhrzeiten statt Schicht-Dropdown (380c48a5):** AssignmentDialog nutzt bereits `start_time`/`end_time` + Presets; `mapShiftTypeToDb` (T0-Fix) unangetastet.
- **Druck-Layout (cf1342ec) + Stundennachweise (79850a60):** Arbeitszeit-Tabelle via `getTimeEntriesForSite`, Foto-Grid, drei Unterschrift-Felder, größere Typo.
- **Foto-Upload (cf1342ec):** Neue Pipeline mit Supabase Storage Bucket `diary-photos` unter Pfad `{company_id}/{diary_id}/{ts}-{filename}`, max 10 Fotos, 5 MB-Limit, JPG/PNG/WebP.
- **Stundennachweise:** Werden in v2 bereits über die bestehende `document-upload.tsx`-Komponente + `diary_documents`-Tabelle abgedeckt — nicht dupliziert.

### Bewusst weggelassen
- **Eigenes `week-plan-dialog.tsx`** (v1-Commit d30cb0d4): Redundant — Bulk-Mode im AssignmentDialog existiert bereits und deckt den Use-Case ab. Stattdessen nur der Einstiegspunkt nachgezogen.
- **v1-`createWeekAssignment`:** v2 hat stattdessen das strukturierte `bulkCreateAssignments({...})` — besserer Typing-Pfad, bleibt so.
- **PDF-Export des Bautagesberichts:** Im v1 nicht als dedizierter Export vorhanden, Browser-Print deckt es ab. Nicht portiert.

## Schema-Findings

### `diary_photos`-Spalten (laut `lib/types/database.ts`)
```
id              uuid   (pk)
diary_entry_id  uuid   (fk diary_entries.id, NOT NULL)
file_path       text   (Storage-Pfad innerhalb des Buckets)
caption         text?  (optional)
created_at      timestamptz
```
**Kein** `company_id`, **kein** `uploaded_by`, **kein** `file_name`, **kein** `file_size`.
Konsequenz:
- Company-Ownership wird **über Join** `diary_photos → diary_entries.company_id` geprüft.
- Dateiname wird im `file_path` kodiert (Zeitstempel-Prefix), nicht separat gespeichert.
- `uploaded_by` wird ausschließlich im Activity-Log festgehalten.

### Supabase Storage Bucket `diary-photos` — Status
**Muss von Mikail im Supabase Dashboard angelegt werden**, falls nicht vorhanden:

1. Bucket Name: `diary-photos`
2. Public: **Ja** (damit `buildPhotoUrl` eine öffentliche URL liefern kann). Alternativ: private Bucket + signed URLs in `getDiaryPhotos` — dann Helper anpassen.
3. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
4. Max file size: 5 MB
5. RLS-Policy empfohlen:
   - `INSERT`: `bucket_id = 'diary-photos' AND (storage.foldername(name))[1] = auth.jwt() ->> 'company_id'`
   - `SELECT`: analog (oder public-read)
   - `DELETE`: analog

Pfad-Konvention: `{company_id}/{diary_entry_id}/{timestamp}-{safe_filename}`.

Solange der Bucket fehlt, schlägt `uploadDiaryPhoto` mit `Bucket not found` fehl — die UI zeigt dies korrekt als Toast.

## Test-Plan

### Disposition — Wochenplanung
1. `/disposition` → KW-Header zeigt "Woche planen"-Button rechts.
2. Klick → AssignmentDialog öffnet sich im Bulk-Mode, Employee-Select ist aktiv.
3. MA + Baustelle wählen, Mo–Fr aktiv (Standard), Früh-Preset klicken → 06:00–14:30.
4. "5 Tage planen" → Toast "5 Zuweisungen erstellt", Grid zeigt 5 Zellen gefüllt.
5. Konflikt-Test: gleichen MA nochmal Mo–Fr planen → Toast-Warnung listet Konflikt-Daten.

### Disposition — Tagesansicht
1. Tab "Tagesansicht" → zeigt heutigen Tag, Spalten pro Baustelle, Stundenleiste 0–23.
2. Chevron-Buttons wechseln Tag; Nachtschichten zeigen Mond-Icon.

### Disposition — Schichtzeiten
1. AssignmentDialog öffnen, manuell "Von 07:30 / Bis 16:00" eintragen → `shift_type` schaltet automatisch auf `custom`.
2. Speichern → Eintrag zeigt "07:30-16:00" im Grid.

### Bautagesbericht — Foto-Upload
1. `/bautagesbericht/<id>` → neue Fotos-Card.
2. "Foto hinzufügen" → JPG < 5 MB wählen → Toast "Foto hochgeladen", Thumbnail erscheint.
3. JPG > 5 MB → Toast "Foto ist zu groß".
4. PDF hochladen → Toast "Nur JPG, PNG oder WebP erlaubt".
5. 11. Foto → Toast "Maximal 10 Fotos pro Bericht".
6. Thumbnail klicken → Lightbox; Löschen → Bestätigung → Foto weg, Storage-Objekt gelöscht.

### Bautagesbericht — Druck
1. Detail-Seite → "Drucken" → neue Tab öffnet `/bautagesbericht/{id}/drucken`.
2. Header mit Firma + Datum; Meta-Grid (Baustelle/Wetter/Polier); Arbeitszeit-Tabelle mit Gesamt; Leistungen; Fotos auf neuer Seite (page-break); drei Unterschrift-Slots.
3. Cmd/Ctrl+P → A4-Preview, 15 mm Margin, Farben erhalten (`print-color-adjust: exact`).

### Cross-Check: T0-Fix
- `mapShiftTypeToDb` bleibt unverändert — frueh→morning, spaet→afternoon, rest→null.
- Bulk-Insert über Früh-Preset → DB-Row `shift="morning"` (CHECK-Constraint respektiert).

## TypeScript-Status

`npx tsc --noEmit` → Mein Scope (`lib/actions/disposition.ts`, `lib/actions/diary.ts`, `app/(app)/disposition/**`, `app/(app)/bautagesbericht/**`, `components/modules/disposition/**`, `components/modules/diary/**`) ist **fehlerfrei**.

Verbleibende Fehler sind ausschließlich in Stream-2-Dateien (`lib/actions/soka.ts`, `components/modules/company/soka-export-client.tsx`, `app/(app)/firma/steuerberater/page.tsx`).

## Offene Punkte für Mikail
1. **Supabase Storage Bucket `diary-photos` anlegen** (siehe Schema-Findings).
2. RLS-Policies für Bucket entsprechend Pfad-Konvention konfigurieren.
3. Public-Read-Zugriff sicherstellen ODER `buildPhotoUrl` auf signed URLs umbauen.
