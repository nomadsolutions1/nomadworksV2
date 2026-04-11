# NomadWorks v2 — Technical Assessment

**Autor:** David Mueller, Technical Architect & Engineering Director
**Datum:** 2026-04-10
**Status:** Read-only Analyse, keine Code-Aenderungen
**Begleitdokument:** suleyman-assessment.md (Strategic / Business Angle)

> Kein geschoentes Reporting. Alle Befunde sind im Code verifiziert. Wo Annahmen noetig waren, steht es explizit dabei.

---

## 0. Kontext in 10 Zeilen

- v2 (C:/Users/X/nomadworks-v2, Repo nomadsolutions1/nomadworksV2, main, deployed auf Vercel) ist ein 18-Commit-Rebuild ab 81cd2582 "Foundation: NomadWorks v2 komplett aufgesetzt".
- v1 (C:/Users/X/nomadworks, Repo seba-nomad/nomadworks, dev-Branch) hat 128+ Commits, davon ~70 Fix/Feature-Commits NACH dem v2-Fork. Diese Fixes sind groesstenteils nicht in v2 angekommen.
- Gemeinsame Supabase-DB (lxeuiiwgnvtibyacanyp). Schema identisch, v2 nutzt typisierte Database-Types — Tabellen fuer Fuhrpark/Lager/Sub existieren (vehicles, equipment, materials, subcontractors, ...), v2-Module greifen aber noch nicht darauf zu.
- Architektur-Qualitaet v2 ist deutlich hoeher als v1: withAuth-Wrapper in 148 Stellen ueber 16 Action-Dateien, Admin-Client sauber gekapselt, typisierte DB-Zugriffe, company_id wird durchgehend gesetzt, proxy.ts existiert und implementiert Defense-in-Depth.
- Gleichzeitig fehlen 3 komplette Module (fuhrpark, lager, subunternehmer), mehrere Cross-Module-Features, sowie die meisten v1-E2E-Bugs sind nicht explizit verifiziert.

---

## 1. Modul-Status v2

Quelle: app/(app)/**, lib/actions/**, components/modules/** in C:/Users/X/nomadworks-v2/.

| Modul | v2-Route | Actions-Datei | LoC | Completeness vs. FEATURES.md | Quality-Flag |
|---|---|---|---|---|---|
| Dashboard | dashboard/ | dashboard.ts | 443 | ~85% (Warnungen teilw., TUEV fehlt) | GREEN |
| Mitarbeiter | mitarbeiter/ | employees.ts | 1010 | ~90% (Personalakte, Quali, Urlaub, Sick, Berechtigungen, Reset) | GREEN |
| Baustellen | baustellen/ + /karte | sites.ts | 740 | ~70% (Nachkalk/Team-Tab aus v1 Block 2 fehlen) | YELLOW |
| Disposition | disposition/ + /zeiterfassung | disposition.ts | 537 | ~65% (Woche/Bulk/Uhrzeiten; Tagesansicht aus v1 Update B fehlt) | YELLOW |
| Auftraege | auftraege/ + /kunden | orders.ts + customers.ts | 1030+216 | ~60% (Nachtraege, Nachkalk-Tab, Regierechnung fehlen) | YELLOW |
| Rechnungen | rechnungen/ | invoices.ts | 1228 | ~85% (Auto-Nr, PDF, Mahnwesen; §13b unklar) | GREEN/YELLOW |
| Bautagesbericht | bautagesbericht/ | diary.ts | 535 | ~80% (Druck-Layout verifizieren) | GREEN |
| Stempeluhr | stempeln/ + /zeiterfassung | time-entries.ts | 703 | ~80% (KRITISCH: Worker->Disposition-Link gegen v1 391ca061 pruefen) | YELLOW |
| Stundenzettel | stundenzettel/ | time-entries.ts | — | ~70% | YELLOW |
| Firma/Billing | firma/ | settings+billing+soka | 340+170+146 | ~60% (SOKA + Steuerberater-Modi fehlen) | YELLOW |
| Admin | admin/ | admin.ts | 466 | ~75% (Wizard, Statistiken, Branding verifizieren) | YELLOW |
| Onboarding | onboarding/ | onboarding.ts | 135 | ~60% (Abgleich v1 e4092bbf) | YELLOW |
| Profil | profil/ | profile.ts | 160 | ~90% | GREEN |
| Benachrichtigungen | benachrichtigungen/ | notifications.ts | 109 | ~70% | YELLOW |
| **Fuhrpark** | — fehlt — | — fehlt — | 0 | **0%** | **RED** |
| **Lager & Einkauf** | — fehlt — | — fehlt — | 0 | **0%** | **RED** |
| **Subunternehmer** | — fehlt — | — fehlt — | 0 | **0%** | **RED** |
| IT-Service | — | — | 0 | "Coming Soon" v1 Update 9 — v2 hat nicht mal Placeholder | LOW PRIO |

**Gesamtbild:** v2 ist funktional auf etwa **60–65% des v1-Feature-Sets**, qualitativ aber deutlich sauberer.

---

## 2. Fehlende Module — Portierungsplan

### 2.1 Fuhrpark

**v1-Quellen (volle Portierung, XL):**
- lib/actions/fleet.ts (1071 LoC, 16 Funktionen: Vehicles + Equipment + Fuel + Trip + Costs + Workshop + Photos)
- app/(app)/fuhrpark/{page,fahrzeuge,maschinen,werkstatt}/**/page.tsx (10 page.tsx-Dateien)
- components/modules/fleet/*.tsx (14 Dateien: vehicle/equipment/workshop-{list,detail,form,new} + fuel-log + trip-log + fleet-overview + workshop-card)

**Anpassungen beim Portieren (Pflicht):**
1. AnyRow-Casts raus — v2 nutzt typisiertes Database.
2. requireCompanyAuth + checkModuleAccess umstellen auf withAuth("fuhrpark", "read" | "write", ...).
3. Hardcoded Hex-Farben auf Tailwind-Tokens (Sarah). Umlaut-Fixes aus v1 c6b5cd9 mituebernehmen.
4. Workshop-Status-Workflow mit Auto-Update auf vehicles.availability_status 1:1 erhalten.
5. Schema-Diff pruefen: equipment_costs + workshop_photos in v2-database.ts verifizieren.
6. **asset_assignments** (v1 Commit 63b2fb51 "Punkt 1: Fuhrpark Standorte"): Ersetzt Single-Column current_site_id durch Zuweisungshistorie. Mitportieren — kritisch fuer Cross-Module.
7. TUEV-Warnung (< 30 Tage) an Dashboard-Warnungs-Hook ankoppeln (E2E-Bug M1).

**Gesamt-Scope Fuhrpark: XL** — 2–3 Tage Marcus + 0.5 Tag Elena + 0.5 Tag Sarah.

### 2.2 Lager & Einkauf

**v1-Quellen (XL):**
- lib/actions/inventory.ts (1102 LoC, 19 Funktionen: Materials + Suppliers + PO + Movements + Bundles)
- app/(app)/lager/{page,materialien,lieferanten,bestellungen}/**/page.tsx (9 Dateien)
- components/modules/inventory/*.tsx (14 Dateien inkl. bundle-manager, movement-dialog, po-delivery-input, po-detail-actions)

**Anpassungen:**
1. Auth-/Typ-Modernisierung wie Fuhrpark.
2. **Kritischer v1-Bugfix mitnehmen:** 67753c7d "negative Bestaende werden jetzt verhindert" (E2E K2+K3).
3. Einheiten-Fix: b3389902 + 3ba32c7f — Tonne/Sack/Palette im Dropdown gegen DB-CHECK (E2E M4).
4. **Auto-Bestands-Update** bei inventory_movements mit order_id muss order_costs befuellen — v1 hatte diesen Link nur strukturell, nicht funktional. Beim Port sauber bauen.
5. Bundle-Manager (material_bundles + material_bundle_items) komplett uebernehmen, Zod-Schemas neu schreiben.

**Gesamt-Scope Lager: XL** — 2–3 Tage Marcus + 0.5 Tag Elena.

### 2.3 Subunternehmer

**v1-Quellen (M):**
- lib/actions/subcontractors.ts (375 LoC, 7 Funktionen: Stammdaten + Assignments + §13b)
- app/(app)/subunternehmer/{page,neu,[id]}/page.tsx
- components/modules/subcontractors/*.tsx (6 Dateien)

**Anpassungen:**
1. §13b Reverse Charge aus v1 6f7915d5 (Update 6) zwingend mitnehmen.
2. §48b Freistellungsbescheinigung mit Ablauf-Warnung an Dashboard-Hook koppeln.
3. subcontractor_assignments -> order_costs Auto-Propagation sauber bauen (v1 hatte das nicht).
4. AddressFields aus v1 4c0d27fd (Punkt 6) mitnehmen.

**Gesamt-Scope Subunternehmer: M** — 1.5 Tage Marcus + 0.5 Tag Elena.

### 2.4 Portierungs-Reihenfolge (Abhaengigkeiten)

Fuhrpark/Lager/Subunternehmer -> Cross-Module-Kostentracker -> Nachkalkulation-Tab.

**Empfehlung:** Fuhrpark + Lager sequentiell durch Marcus (gleicher Agent), Subunternehmer danach. Sueleymans Strategie-Report entscheidet ueber die Business-Reihenfolge. Technisch empfehle ich **Lager zuerst**: (a) E2E-Bugs K2/K3 blockieren Pilotkunden, (b) Cross-Module-Pfad simpler, (c) v1-Code stabiler getestet.

---

## 3. Bugs & Luecken in existierenden v2-Modulen

Format: Datei:Zeile — Severity — Owner — Beschreibung.

### CRITICAL

- **lib/actions/disposition.ts:266-284 — CRITICAL — Elena** — createAssignment schlaegt in Produktion fehl (Sentry). Siehe Abschnitt 6 fuer Root-Cause.
- **lib/actions/time-entries.ts — CRITICAL — Marcus+Elena** — Worker-Stempel-Bug (E2E K1) muss gegen v1 Fix 391ca061 "Stempeluhr zeigt jetzt Baustellen fuer Arbeiter an" verifiziert werden. Wenn Worker-Baustellen-Liste nicht ueber schedule_entries gespeist wird, ist das Produkt fuer Arbeiter unbenutzbar. Hoechste Prio zum Verifizieren.
- **lib/actions/auth.ts:46-92 — CRITICAL — Elena** — Login-Flow erstellt companies+profiles falls kein Profil existiert, NACH Auth via createClient und OHNE Onboarding-Redirect. (a) Bei DB-Timeout bleibt User ohne Profil aber eingeloggt. (b) companyName-Fallback "Neue Firma" kann leer sein -> ungueltige Company. Muss in Register/Invite-Callback verlagert werden.

### HIGH

- **proxy.ts:139-141 — HIGH — Elena** — role === "employee" wird hart auf /login redirected. Inkonsistenz mit auth-helper.ts:9 (7 Rollen). Entscheidung Mikail noetig.
- **proxy.ts:152-163 — HIGH — Elena** — Onboarding-Redirect macht 2 Supabase-Queries pro Request fuer Owner, jede Page-Navigation. Sollte aus bereits geladenem Profile kommen. Performance-Regression im Hot-Path.
- **proxy.ts:190 — HIGH — Elena** — isWriteRoute-Heuristik via Pfad-Endung ist naive. Echte Writes via Server Actions auf beliebigen Pfaden. Proxy suggeriert eine Sicherheit die er nicht hat.
- **lib/config/navigation.ts:42 — HIGH — Sarah** — zeiterfassung zeigt auf /disposition/zeiterfassung, ist in APP_MODULES als separates Item. Gleichzeitig existiert /zeiterfassung als Worker-Route. Navigations-Dublette. v1-Aufraeumen aus cf02e529 fehlt.
- **lib/actions/auth.ts:128-133 — HIGH — Elena** — requestPasswordReset Fallback auf https://nomadworks.vercel.app hardcoded. Luecke 5 nur teilweise gefixt. Preview-Deployments schicken Reset-Link auf Production.
- **lib/actions/employees.ts:13-28 — HIGH — Elena** — createEmployeeSchema erlaubt Rolle "owner". RBAC-Spec sagt "pro Firma genau 1 Geschaeftsfuehrer". Enforcen oder dokumentieren.
- **lib/actions/employees.ts:13-28 — HIGH — Elena** — Enum enthaelt accountant + office, aber proxy.ts:174 behandelt sie wie Foreman. Differenzierung oder Doku noetig.

### MEDIUM

- **lib/actions/disposition.ts:190-193 — MEDIUM — Marcus** — getCapacities laedt alle profiles ausser super_admin — inkludiert worker, employee, office, accountant. Kapazitaetsplanung sollte nur worker+foreman umfassen.
- **lib/actions/disposition.ts:388-404 — MEDIUM — Elena** — deleteAssignment prueft "Ersteller" via activity_log-Query (kein created_by-Spalte). Fragil gegenueber Cleanup-Cron. Empfehlung: created_by-Spalte zu schedule_entries hinzufuegen.
- **proxy.ts:210-211 — MEDIUM — Alex** — Matcher exkludiert nicht /robots.txt, /sitemap.xml, /manifest.json.
- **components/modules/disposition/assignment-dialog.tsx:106 — MEDIUM — Marcus** — Verifizieren ob FormData shift_type korrekt befuellt.
- **lib/actions/invoices.ts (1228 LoC, nicht voll gelesen) — MEDIUM — Elena** — Groesste Action-Datei, dedicated Security-Review noetig.
- **tests/** — MEDIUM — James** — Vermutlich keine E2E-Tests fuer v2-Flows (nicht verifiziert).
- **Dashboard TUEV-Warnung — MEDIUM — Marcus** — Hook in dashboard.ts vorbereiten, wird beim Fuhrpark-Port relevant.

### LOW

- **lib/actions/auth.ts:87 — LOW — Elena** — Worker-Redirect inkonsistent: Action sagt /stempeln, Proxy sagt /zeiterfassung. Beide existieren.
- **proxy.ts:37 — LOW — Elena** — pathname.includes(".") als Static-Asset-Check zu weit gefasst.
- **Mehrere Actions — LOW** — as Promise Casts am Ende von withAuth-Wrapper. withAuth-Generic nicht sauber typisiert.

---

## 4. v1-Features die fehlen (nicht als "Modul")

| Feature | v1-Quelle | Empfehlung | Verantwortlich |
|---|---|---|---|
| asset_assignments (Fuhrpark-Historie) | Commit 63b2fb51 "Punkt 1" | PORTIEREN — Basis fuer Cross-Module | Marcus + Elena |
| Steuerberater-Rolle accountant | 4bccbd9d + 2fc68c58 + ed8d1fee | Teilweise portiert (Enum da). UI + Modi + Auto-Find fehlen | Marcus + Lena |
| SOKA-Bau CSV Export | Commit 40efddb2 "Update E" | soka.ts existiert (146 LoC) — Inhalt verifizieren, Export-Route + Print-View bauen | Marcus + Elena |
| §13b Reverse Charge | Commit 6f7915d5 "Update 6" | PORTIEREN — mit subcontractors-Modul | Marcus |
| Auftrags-Nachtraege (Change Orders) | 7a5f1dfb + 9651bb80 "Punkt 10" | PORTIEREN — kritisch fuer Bau-Realitaet | Marcus |
| Bautagesbericht Druck-Layout | Commit cf1342ec "Update D" | Verifizieren / portieren | Marcus |
| Nachkalkulation SOLL vs. IST | Commit 340704b7 Block 2 | PORTIEREN | Marcus |
| Team-Tab auf Baustellen-Detail | Commit 340704b7 Block 2 | PORTIEREN | Marcus |
| Regierechnung aus Zeiterfassung | fc6aa124 + ce459f96 "Punkt 4" | PORTIEREN | Marcus + Elena |
| Aufmass-Tab auf Baustellen-Detail | Commit 72c749e1 "Punkt 7" | PORTIEREN | Marcus |
| Woche planen Button (Disposition) | Commit d30cb0d4 "Punkt 3" | PORTIEREN | Marcus |
| Disposition Uhrzeiten statt Schicht | Commit 380c48a5 "Punkt 2" | v2 teilweise — UI verifizieren | Marcus |
| Qualifikationen issued_by | Commit 055bcf47 "Update 2" | OK (verifiziert v2 employees.ts:54-60) | — |
| job_title + Teilzeit-Vertragsart | Commit 48c4aff2 "Update 1" | OK (verifiziert v2 employees.ts) | — |
| E-Mail-Bestaetigungs-Callback | 5e4e59ab + 72324f85 | v2 auth.ts:119 -> /verify. /auth/callback + Profile-Creation dort verifizieren | Elena |
| Sentry Session Replays + Feedback | f24b04b4 + 6d7a6e7c + 920f2268 | Teilweise portiert. Replays/Feedback verifizieren | Alex |
| Stripe Checkout + Webhooks | b83afffe + 3bf25f42 + 56a70fba | Teilweise portiert (billing.ts 170 LoC). Webhook-Route verifizieren | Elena |
| Rechtliches (Impressum/Datenschutz/AGB/Cookie) | d2c73391 + 987aa493 | DSGVO-kritisch vor Launch | Lena + Marcus |
| 6-Schritt Onboarding Wizard | Commit e4092bbf | v2 onboarding.ts 135 LoC — Wizard-Seiten verifizieren | Marcus + Lena |
| Register-Seite Split-Layout | 2da96e28 et al. | Verifizieren | Marcus + Sarah |
| IT-Service "Coming Soon" | Commit cf02e529 | VERWERFEN — nicht im MVP-Scope | — |
| Auth Context + paralleles Laden + Polling | Commit c396bf7f | PORTIEREN — Performance-relevant | Elena + Marcus |
| Loading Skeletons | Commit 692ffb40 | v2 hat loading.tsx pro Modul. Inhalt verifizieren | Sarah |

---

## 5. Sicherheits-Status — 10 Punkte aus Elena-Spec

Quelle: .claude/agents/nomadworks/elena-petrov.md:90-101. Ueberpruefung gegen v2-Code.

| # | Luecke (v1) | v2-Status | Datei:Zeile | Action |
|---|---|---|---|---|
| 1 | /api/* Routes im Proxy ungeschuetzt | TEILWEISE — proxy.ts:41-48 prueft Session fuer /api (ausser webhooks+cron), keine Modul-Berechtigung enforceable | proxy.ts:41-48 | OFFEN — Audit |
| 2 | Subcontractor-Assignments ohne company_id | N/A (Modul fehlt). Beim Portieren sicherstellen | — | PREVENTIVE |
| 3 | SOKA ohne Role-Check | VERIFIZIEREN — soka.ts nicht gelesen | soka.ts | OFFEN |
| 4 | Dashboard-Actions ohne Role-Check | GEFIXT — dashboard.ts nutzt withAuth 8x | dashboard.ts | GEFIXT |
| 5 | requestPasswordReset hardcoded URL | TEILWEISE — auth.ts:131 Fallback hardcoded | auth.ts:128-133 | OFFEN — High |
| 6 | Kein Stripe-Webhook | UNKLAR — billing.ts vorhanden, Webhook-Route whitelistet, Datei + Signature-Verify nicht verifiziert | app/api/webhooks/stripe/ | OFFEN — Verify |
| 7 | Error-Tracker auf Filesystem -> Sentry | GEFIXT — instrumentation + sentry configs + 224 trackError-Treffer | Root | GEFIXT |
| 8 | Admin listUsers ohne Firmenfilter | VERIFIZIEREN — admin.ts (466 LoC) nicht gelesen | admin.ts | OFFEN |
| 9 | Proxy Fallback role="worker" | GEFIXT — proxy.ts:96-104 "deny access instead" | proxy.ts:96-104 | GEFIXT |
| 10 | checkModuleAccess erstellt neuen Admin-Client | GEFIXT — auth-helper.ts:80-103 nimmt db als Parameter | auth-helper.ts:80-103 | GEFIXT |

**Zusaetzliche v2-Findings:**

| # | Befund | Datei:Zeile | Severity |
|---|---|---|---|
| 11 | checkModuleAccess behandelt foreman/office/accountant identisch — alle lesen aus foreman_permissions. RBAC-Spec unterscheidet nicht | auth-helper.ts:93-102 | HIGH |
| 12 | filterSensitiveData importiert, Anwendung in allen Query-Pfaden nicht verifiziert | employees.ts | HIGH |
| 13 | auth.ts Login erstellt Company+Profile ohne Rate-Limit, Captcha, Email-Verification — Ghost-Company-Spam-Pfad | auth.ts:52-82 | HIGH |
| 14 | Proxy-Write-Route-Heuristik truegt — echte Writes via Server Actions auf beliebigen Pfaden | proxy.ts:190 | MEDIUM |

**Gesamt-Security-Bilanz:** v2 hat **4 von 10** Altlasten sauber gefixt, **2 teilweise**, **4 noch zu verifizieren**, **4 neue Findings** dazugekommen.

---

## 6. createAssignment-Bug — Root-Cause-Analyse

**Symptom:** Sentry meldet Runtime-Fehler, createAssignment INSERT in schedule_entries schlaegt fehl in Produktion.

**Code-Review (lib/actions/disposition.ts:218-313):** Die Funktion ist sauber gebaut:
- withAuth("disposition","write") — OK
- Zod-Validierung — OK
- company_id cross-check fuer employee + site — OK
- mapShiftTypeToDb -> null fuer "ganztag" — OK
- insert(...) mit allen Feldern, die das v2-Database-Type fuer schedule_entries deklariert (database.ts:2060-2086) — OK

**Vergleich mit v1-Fix (v1 Commit ae1e4bbe "Disposition Fix: schedule_entries_shift_check Constraint beachten"):** In v1 wurde genau dieser Fall gefixt — die DB hat einen CHECK-Constraint schedule_entries_shift_check, der "full_day" ablehnt und stattdessen NULL verlangt. v1 mappt full_day -> null. v2 macht das Aequivalent fuer ganztag -> null.

**Wahrscheinliche Root-Causes (priorisiert):**

1. **Der CHECK-Constraint in der Supabase-DB erlaubt die v2-Enum-Werte frueh/spaet/nacht/custom NICHT.** v1 hatte urspruenglich morning/afternoon (siehe supabase/migrations/001_disposition_assignments.sql:14 — das gilt aber fuer die andere Tabelle disposition_assignments, nicht schedule_entries). Die echte schedule_entries.shift-CHECK-Definition liegt nur im Supabase-Dashboard und wurde nicht in Migration-Files getrackt. v2 hat den Zod-Enum mit neuen Werten (frueh/spaet/nacht/ganztag/custom), aber die DB-Constraint ist nicht mitgewandert. Sobald shift != null, schlaegt INSERT fehl. **Top-Hypothese.**

2. Alternativ: Die Row enthaelt implizit ein Feld, das v2 mit NULL sendet, aber die DB als NOT NULL erwartet. Weniger wahrscheinlich.

3. Unwahrscheinlich: RLS-Fehler trotz Admin-Client — auth-helper.ts:42 nutzt createAdminClient() mit Service-Role-Key, RLS wird bypassed.

**Empfohlene Verifikation (Elena + Alex, 15 Minuten):**

SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.schedule_entries'::regclass AND conname LIKE '%shift%';

**Fix-Optionen:**
- **Option A (schnell):** v2-mapShiftTypeToDb auf DB-erlaubte Werte mappen (z.B. frueh -> morning, spaet -> afternoon, andere -> null).
- **Option B (sauber):** DB-Migration ALTER TABLE schedule_entries DROP/ADD CONSTRAINT mit IN ('frueh','spaet','nacht','custom') oder IS NULL. Macht Alex.

**Zeitbudget Fix:** 30 Min Diagnose + 30 Min Fix + Redeploy. HOECHSTE Prio.

---

## 7. Portierungs-Reihenfolge mit Abhaengigkeiten

> Business-Reihenfolge siehe Sueleymans Strategic Plan (docs/v2-rebuild/suleyman-assessment.md). Unten die rein technische Reihenfolge.

### Phase T0 — Heute (Blocker-Fixes, 1 Tag)

1. createAssignment-Root-Cause (Abschnitt 6) — Elena + Alex.
2. Worker-Stempeluhr verifizieren (K1) — Marcus liest time-entries.ts + stempeln/page.tsx gegen v1 391ca061. Wenn kaputt -> sofort fixen.
3. requestPasswordReset Hardcoded-URL entfernen (Luecke 5) — Elena.
4. auth.ts Login-Company-Creation in Register/Invite-Callback verlagern — Elena.
5. Security-Audit der 4 offenen Punkte (1, 3, 6, 8) — Elena, 2–3 Stunden.

### Phase T1 — Module Port Wave 1 (Tag 2–4)

| Track | Agent | Task |
|---|---|---|
| A | Marcus | Lager & Einkauf (K2/K3-Bugs zuerst) |
| B | Marcus (sequentiell nach A) | Fuhrpark (XL) |
| C | Elena | Security-Review Wave 1 + Stripe-Webhook verifizieren |
| D | Sarah | Farbtoken-Migration + DataTable-Refresh |
| E | James | E2E-Setup (Playwright oder Browser-Use), RBAC-Matrix |

### Phase T2 — Module Port Wave 2 (Tag 5–6)

| Track | Agent | Task |
|---|---|---|
| A | Marcus | Subunternehmer + §13b |
| B | Marcus | Cross-Module-Integration (Kostentracker, Nachkalkulation) |
| C | Elena | Security-Review Wave 2, Cron Jobs, SOKA |
| D | Sarah | Empty States, Skeleton Refresh |
| E | James | Regression-Tests Wave 1+2, RBAC-Matrix voll |

### Phase T3 — Feature-Luecken Port (Tag 7–9)

- Auftrags-Nachtraege (Marcus)
- Aufmass-Tab + Nachkalkulation-Tab + Team-Tab (Marcus)
- Regierechnung (Marcus + Elena)
- Bautagesbericht Druck + Foto (Marcus + Sarah)
- Steuerberater-Modi (Marcus + Lena)
- SOKA-Export komplett (Marcus + Elena)

### Phase T4 — Launch-Readiness (Tag 10–12)

- DSGVO (Impressum, Datenschutz, AGB, Cookie-Banner) — Lena + Marcus
- Rechtstexte + Trust-Badges — Lena
- E-Mail-Templates final — Lena + Alex
- Cron Jobs (Trial-Check, Reminders, Monthly Reports) — Elena + Alex
- E2E-Abnahme-Lauf — James
- Stripe-Live-Modus-Switch — Alex

**Gesamtlaufzeit:** realistisch 10–12 Arbeitstage bei fokussierter Execution.

---

## 8. Quality Gates pro Modul

Kein Modul "done" bevor alle 6 Gates gruen sind. Abnahme: David + James + Elena.

| Gate | Kriterium | Pruefer |
|---|---|---|
| G1 — Typ-Sicherheit | Keine AnyRow, any, as unknown as ausser dokumentiert. tsc --noEmit gruen | Marcus -> David |
| G2 — Auth-Check | Jede Server Action nutzt withAuth(modul, mode, ...) oder dokumentiert warum nicht | Elena -> David |
| G3 — company_id Filter | Jede DB-Query (read + write + delete) hat company_id-Filter. Grep-Check | Elena -> David |
| G4 — RBAC-Matrix | Jede Route pro Rolle getestet (owner, foreman-mit/ohne-Permission, office, accountant, worker, employee, unauth). Matrix in docs/test-reports/rbac-matrix.md | James -> David |
| G5 — E2E-Flow | Happy-Path mit realistischen Daten, Screenshot + Log. Min. 5 Schritte pro Modul | James -> David |
| G6 — Sentry 0 Errors | 24h nach Deploy keine Sentry-Errors aus dem Modul | Alex + Elena -> David |

**Zusaetzliche Regeln:**
- Kein Modul darf parallel zu seinem Security-Review in main gemerged werden.
- Jeder PR: Zustimmung von mindestens 2 Agents (Owner + 1 Reviewer).
- Kein --no-verify, kein Skip-Hook. Root-cause fixen, nicht bypassen.
- Red Flag: mehr als 3 Commits in Folge ohne Test-Update -> Stop, James einbinden.

---

## 9. Was ich explizit NICHT bewertet habe

Fuer vollstaendige Transparenz:

- lib/actions/invoices.ts (1228 LoC) — nur Grep, nicht voll gelesen. Security-Audit offen.
- lib/actions/orders.ts (1030 LoC) — nur Grep, nicht voll gelesen.
- lib/actions/admin.ts (466 LoC) — nur Grep, nicht voll gelesen. Kritisch (Luecke 8).
- lib/actions/soka.ts (146 LoC) — nicht gelesen. Kritisch (Luecke 3).
- app/(app)/**/page.tsx — Server/Client-Boundary-Audit nicht gemacht.
- components/modules/** — UI-Qualitaet nur stichprobenartig.
- app/api/webhooks/stripe/ — Existenz nicht verifiziert. Kritisch.
- tests/** — Existenz und Coverage nicht verifiziert.
- Live-DB-Constraints — nicht abgefragt (siehe Abschnitt 6).

Diese Punkte sind fuer Elena + Marcus + James als Follow-up-Tasks zu vergeben.

---

## 10. Schlussbewertung

**Transparenz:** v2 ist qualitativ ein Sprung nach vorne — Admin-Client, typisierte DB, withAuth-Wrapper, Proxy-Defense-in-Depth — aber quantitativ ein Rueckschritt: 3 fehlende Module, ~70 nicht-portierte v1-Fixes, Cross-Module-Integration kaum angerissen, kritischer Produktions-Bug bei Disposition.

**Urteil:** Die Architekturbasis traegt. Das Team kann darauf aufbauen. Aber main darf nicht als "launch-ready" vermarktet werden, solange (a) der Disposition-Bug live ist, (b) Worker-Stempelflow nicht verifiziert ist, (c) 3 Kernmodule fehlen, (d) 4 Security-Audits offen sind. Das sind 10–12 Team-Tage bei fokussierter Execution.

**Entscheidungs-Gate fuer Mikail:** Siehe Zusammenfassung an die aufrufende Instanz.

— David
