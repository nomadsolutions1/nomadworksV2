# Strategic Assessment - NomadWorks v2 Completion

**Autor:** Sueleyman (Senior PM, Nomad Solutions)
**Adressat:** Mikail Suenger (CEO)
**Datum:** 2026-04-10
**Status:** Research / Decision-Grundlage - noch kein Execution-Go
**Companion Report:** docs/v2-rebuild/david-technical-assessment.md

---

## Executive Summary

v2 ist **ca. 55 %** des anvisierten Scopes: Dashboard, Mitarbeiter, Baustellen, Disposition, Auftraege, Rechnungen, Bautagesbericht, Admin, Auth und Onboarding laufen und sind deployed. Es fehlen **drei komplette Module** (Fuhrpark, Lager, Subunternehmer) plus deren Server-Actions (fleet.ts, inventory.ts, subcontractors.ts). Die Navigation verlinkt bereits auf diese Seiten - Klick fuehrt zu 404. Dazu kommen **10 dokumentierte Sicherheitsluecken** aus dem v1-Audit (u. a. fehlende company_id-Filter, checkModuleAccess-Luecken, kein proxy.ts), die beim Port von v1 -> v2 **nicht** automatisch mitkommen, sondern aktiv geschlossen werden muessen.

v1 hat im nicht-gepushten dev-Branch (111 Commits Vorsprung) **genau die Module implementiert, die v2 fehlen**, plus eine Reihe wertvoller Features (Nachkalkulation, Cross-Module-Kostentracker, Regierechnung, Auftrags-Nachtraege, SOKA-Export, Steuerberater-Konfiguration, Paragraph 13b Reverse Charge, asset_assignments). **Wichtig:** v1-dev hat die Security-Luecken aus dem 2026-04-05-Audit bereits zum Teil gefixt (Commit ac494e8a) - v2 hat diese Fixes **nicht**.

**Meine Empfehlung:** **GO mit Scope-Disziplin.** v2 als Ziel-Architektur beibehalten, v1-dev als Referenz-Quelle fuer Feature-Port, jede Zeile beim Port durch Elena (Security) geprueft. Zeitplan nach Phasen, nicht Kalender - dazu brauche ich von dir sieben Antworten (siehe Abschnitt 7).

---

## 1. Scope-Entscheidungen (Was v1 -> v2, was nicht)

### 1.1 MUSS portiert werden (Kern-ERP)

- **Fuhrpark** (Fahrzeuge + Maschinen + Werkstatt): Navigation verlinkt darauf, 404. Kern-USP. DB-Tabellen existieren. Quelle: app/(app)/fuhrpark/*, lib/actions/fleet.ts
- **Lager & Einkauf** (Materialien, Lieferanten, Bestellungen, Buendel, Bewegungen): 404 in v2. Essenziell fuer Kostentracker.
- **Subunternehmer** (inkl. Paragraph 48b, Bewertung, Assignments): 404 in v2. Deutscher Baumarkt-Must.
- **Cross-Module-Kostentracker Baustellen-Detail**: Im Audit als Prio 3. v1-dev Commit bcb566e0 hat das bereits.
- **Nachkalkulation + Team-Tabs Auftrags-Detail**: v1-dev Commit 340704b7. v2 hat nur Stub.
- **SOKA-Bau Export (CSV + PDF)**: Regulatorisch fuer DE-Baufirmen. soka.ts ist in v2 Stub.
- **Security-Fixes** aus v1-dev Commits ac494e8a, 64b6c7b8, 96fcf128: Blockt produktiven Einsatz. Elena ownt.

### 1.2 SOLL portiert werden (hoher Wert)

- **Regierechnung aus Zeiterfassung** (fc6aa124): Hebt v2 ueber Excel-Konkurrenz.
- **Auftrags-Nachtraege / Change Orders** (7a5f1dfb, 9651bb80): Margen-Thema.
- **Steuerberater-Konfiguration + DATEV-Export** (e11d38c7, ed8d1fee, 2fab6470): Vertriebsargument.
- **Paragraph 13b Reverse Charge fuer Subunternehmer** (6f7915d5): Gesetzliche Pflicht DE.
- **asset_assignments** (Fuhrpark-Standorte pro Baustelle, 63b2fb51): Liefert Daten fuer Kostentracker.
- **AddressFields ueberall** (4c0d27fd, 422dbf92): UX-Qualitaet.
- **DataTable Video-Fixes** (Checkboxen, Spalten-Auswahl, Hover, onRowClick): Shared Component.
- **CurrencyInput Live-Formatierung**: Diff-Port.
- **Loading Skeletons + Perf-Pakete** (692ffb40, c396bf7f).
- **Bautagesbericht Druck-Layout**.

### 1.3 KANN portiert werden (V1.1)

- Cmd+K Globale Suche - nice-to-have.
- Leaflet Baustellen-Karte.
- Worker-Bottom-Nav Politur.
- Aufmass-Tab Baustelle (72c749e1).
- Disposition Woche-planen Button (d30cb0d4).

### 1.4 WIRD NICHT portiert (Kill)

- **it-service/**: Interne Entwickler-Spielwiese. Kein Kundenwert. KILL.
- **v1 direkte-DB-Zugriffe aus Komponenten**: v2-Architektur ist Server-Actions-first. Neu schreiben.
- **v1 as-any-Typisierung**: Nur gefixte Variante uebernehmen.
- **Microsoft SSO (Azure AD)**: Nie produktiv. KILL bis Nachfrage.
- **Fragiles PDF-Rendering aus v1**: Buy statt Build pruefen.

### 1.5 MUSS NEU entschieden werden (nicht 1:1 portieren)

- **proxy.ts / Middleware-Route-Protection**: In v1 laut Audit gar nicht da. In v2 auch nicht. Elena baut neu. Defense-in-Depth.
- **RBAC Rollen office + employee**: 0 % in v1, 0 % in v2. Sauber spezifizieren und bauen - nach MVP-Abschluss.
- **Cross-Module-Automatik**: v1 hat nur Teil-Implementierung. v2 braucht saubere Service-Layer-Loesung. Architektur-Call David + Elena.

---

## 2. Prioritaeten-Reihenfolge (Phasen, nicht Tage)

### Phase A - Feuer loeschen (blockiert Release)
1. Security-Audit-Luecken schliessen (die 10 HIGH/MID aus Audit 2026-04-05) - **Elena**
2. proxy.ts / Route-Protection auf Middleware-Ebene - **Elena**
3. inviteEmployee Stub -> echte Resend-Integration - **Elena**
4. Feld-Name-Bug diary.hindrances/notes aufraeumen - **Elena**

**Gate:** James macht RBAC-Test-Matrix vs. aktueller Stand. Kein Merge bis gruen.

### Phase B - Luecken schliessen (die drei fehlenden Module)
5. Fuhrpark (Fahrzeuge -> Maschinen -> Werkstatt) - **Marcus + Elena**
6. Lager & Einkauf (Materialien -> Lieferanten -> Bewegungen -> Bestellungen -> Buendel) - **Marcus + Elena**
7. Subunternehmer (inkl. Paragraph 48b, Paragraph 13b, Bewertung, Assignments) - **Marcus + Elena**

**Parallelisierung:** Alle drei parallel moeglich, Elena ist der Review-Bottleneck.

### Phase C - Cross-Module & Nachkalkulation
8. getSiteCosts + Kostentracker auf Baustellen-Detail - **Marcus**
9. Nachkalkulation + Team-Tabs auf Auftrags-Detail - **Marcus**
10. Disposition -> Stempeluhr Link (schedule_entries -> time_entries) - **Marcus**
11. asset_assignments fuer Fuhrpark-Standorte - **Marcus**

**Gate:** Mikail prueft Cross-Module-Flow manuell an Mueller-Bau-Testfirma.

### Phase D - Regulatorik & Finanzen
12. SOKA-Bau Export (CSV + PDF) - **Elena**
13. Steuerberater-Konfiguration + DATEV-Export - **Elena**
14. Paragraph 13b Reverse Charge - **Elena**
15. Regierechnung aus Zeiterfassung - **Marcus + Elena**
16. Auftrags-Nachtraege - **Marcus**

### Phase E - UX-Politur
17. DataTable Video-Fixes ueberall - **Sarah**
18. CurrencyInput Diff-Port - **Sarah**
19. AddressFields ueberall - **Sarah**
20. Loading Skeletons alle Seiten - **Sarah**
21. Lena: Texte, Empty States, Tipps-Banner, Onboarding-Copy

### Phase F - Infrastruktur Launch-Ready
22. Stripe Checkout + Webhooks + Customer Portal - **Elena + Alex**
23. Resend Templates produktiv - **Elena + Lena**
24. Sentry Alerts + Session Replay Sampling - **Alex**
25. Vercel Cron Jobs (Trial-Check, Reminder, Monthly Reports) - **Alex + Elena**
26. DSGVO (Impressum, Datenschutz, Cookie-Banner, Loesch-Flow) - **Lena + Elena**

### Phase G - Neue Rollen (nach MVP)
27. RBAC office + employee + Feature-Flags - **Elena + Marcus**

### Phase H - Abnahme
28. James: komplette E2E-Test-Suite
29. Performance-Benchmark (Lighthouse, TTFB)
30. Security-Pen-Test
31. Final Go-Live-Abnahme durch Mikail

---

## 3. Team-Dispatch-Plan

| Phase | Lead | Support | Parallelitaet |
|---|---|---|---|
| A - Security-Fires | Elena | James, David | Sequenziell |
| B - Module Port | Marcus | Elena (Review), Sarah (Shared Components) | 3 Module parallel, Elena Bottleneck |
| C - Cross-Module | Marcus | David (Architektur), Elena (Query-Review) | Sequenziell nach B |
| D - Regulatorik | Elena | Marcus, Lena | Parallel zu C moeglich |
| E - UX-Politur | Sarah | Lena, Marcus | Parallel zu C und D |
| F - Infrastruktur | Alex | Elena, Lena | Parallel, Stripe am Ende |
| G - Neue Rollen | Elena | Marcus | Nach MVP-Launch |
| H - Abnahme | James | Alle | Sequenziell |

**David koordiniert** die gesamte Execution, ich (Sueleyman) owne Scope + Checkpoints + Business-Feedback-Gates.

**Warum Elena Bottleneck ist:** Sie reviewt JEDEN Server-Action, JEDE RLS-Entscheidung, JEDES Webhook. Nicht verhandelbar - der Audit zeigt, was passiert wenn Security nebenbei mitlaeuft. David muss Elenas Review-Queue aktiv managen.

---

## 4. Top-5-Risiken

### Risiko 1 - v1-dev-Branch als Wahrheitsquelle ist gefaehrlich
**Typ:** Technisch + Prozess
**Was:** v1-dev hat 111 Commits, die niemand gereviewt hat, manche mit as-any, manche mit Security-Luecken die spaeter gefixt wurden. Der Port darf **nicht** Copy-Paste sein.
**Mitigation:** Fuer jede portierte Datei: v1-Referenz lesen, neu schreiben im v2-Style, Elena reviewt. Nicht git cherry-pick.

### Risiko 2 - Elena wird Bottleneck
**Typ:** Prozess
**Was:** 50+ Server-Actions in Phase B muessen alle durch Elena.
**Mitigation:** Tages-Batching (Elena reviewt einmal morgens). Marcus schreibt Actions nach striktem Template, Elena reviewt nur Abweichungen.

### Risiko 3 - Scope Creep
**Typ:** Business
**Was:** v1-dev hat 111 Commits voller netter Features. Versuchung, alles zu portieren.
**Mitigation:** Sueleyman stoppt jeden Port ausserhalb 1.1/1.2. Kill-Kompetenz fuer V1.1.

### Risiko 4 - Datenbank-Drift zwischen v1 und v2
**Typ:** Technisch
**Was:** v1-dev-Migrationen (Commit 28bfcb0c) sind ggf. in Prod nicht gelaufen. v2 nutzt dieselbe Supabase-Instanz.
**Mitigation:** Alex + Elena machen DB-Schema-Diff v1-dev-Migrations vs. Prod-Stand als erste Task in Phase A. Ergebnis in David Report.

### Risiko 5 - Cross-Module-Automatik als Architektur-Fass ohne Boden
**Typ:** Technisch + Business
**Was:** Oekosystem-Prinzip ueber 6 Module hinweg ist komplex (Event-basiert? Query-Aggregation? Materialized Views?).
**Mitigation:** Architektur-Call David + Elena VOR Code in Phase C. Mikail entscheidet pragmatisch vs. sauber. Empfehlung: MVP pragmatisch, Sauber spaeter.

---

## 5. Feedback-Gates

| Gate | Wann | Wer praesentiert | Entscheidung |
|---|---|---|---|
| **G1 - Scope-Freigabe** | Jetzt | Sueleyman | Bestaetigung 1.1/1.2/1.4 + 7 Fragen |
| **G2 - Cross-Module Architektur** | Ende Phase B | David | Pragmatisch vs. Sauber |
| **G3 - Port-Abnahme Fuhrpark** | Nach erstem Modul | Marcus + Elena | Template-Review |
| **G4 - Security-Freigabe** | Ende Phase A + Phase D | Elena + James | Go fuer Launch-Prep |
| **G5 - Stripe Live** | Mitte Phase F | Elena + Alex | Live-Keys einspielen |
| **G6 - Go-Live** | Ende Phase H | James | Final Abnahme |

**Zwischen Gates handele ich autonom.** Eskalation nur bei Stufe-3-Problemen (fundamentale Blocker).

---

## 6. Was NICHT in diesem Report steht (David-Zustaendigkeit)

Bewusste Nicht-Duplikation mit david-technical-assessment.md:
- Konkrete Bug-Zeilen-Liste (Datei:Zeile) der 10 Security-Findings
- DB-Schema-Diff v1-dev vs. Prod
- Technische Portierungs-Reihenfolge auf Datei-Ebene
- Quality-Gates auf Code-Ebene (Typ-Safety, Test-Coverage, Lint)
- Review-Template fuer Server-Actions
- Konkrete Architektur-Skizze Cross-Module-Kostentracker

---

## 7. Offene Fragen an Mikail

1. **Business-Deadline:** Gibt es einen harten Launch-Termin (Kunden-Zusage, Messe, Investor-Demo)? Aendert Priorisierung zwischen Phase D und Phase F komplett.
2. **Parallele Projekte:** Wie viele andere Projekte laufen bei dir? Team voll fuer v2 reserviert?
3. **Cross-Module-Architektur (G2):** Pragmatisch (Query-Aggregation, ca. 1 Woche) oder sauber (Event-basiert, ca. 3 Wochen)? Empfehlung: pragmatisch.
4. **office + employee Rollen:** Vor oder nach Launch? Empfehlung: nach Launch (V1.1).
5. **Stripe jetzt oder spaeter live:** White-Glove manuell weiter, oder Stripe-Checkout ab Launch? Letzteres = volle Phase F.
6. **v1 abschalten:** Wann geht nomadworks.vercel.app offline und werden Test-Firmen migriert? Doppelte Wartung = doppeltes Support-Risiko.
7. **Budget-Freigabe pro Phase:** Einmalig A-H mit Gate-Eskalation, oder phasenweise? Empfehlung: A-C einmalig, dann G2, dann D-F, dann G4, dann Rest.

---

**Ende des Reports.** Warten auf Antworten zu den 7 Fragen, dann Gate G1 und Execution-Start mit David als Engineering-Director-Lead.
