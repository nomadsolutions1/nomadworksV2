# NomadWorks v3 — Master Plan

**Autor:** Claude (Main Session), in Abstimmung mit Süleyman + David
**Freigabe:** pending Mikail
**Basis:** `suleyman-assessment.md`, `david-technical-assessment.md`, `decisions.md`, `phase-t0-report.md` (Elena), VibeCode-Docs (FEATURES, REBUILD-PLAN, RBAC-SPEC, AUDIT-BERICHT, E2E-TESTBERICHT)
**Ziel:** Eine finale v3 — alle v1-Features + v2-Architektur + neues Design via ui-ux-pro-max Skill.

---

## 0. Executive Summary

**v3 wird auf einem neuen Branch `v3-rebuild` im bestehenden `nomadworksV2`-Repo gebaut.** v2 main bleibt als stabile Fallback-Version. Alle Arbeit fließt in `v3-rebuild`. Wenn v3 launch-ready ist, wird der Branch auf main gemergt und zur neuen Production.

**Warum Branch statt neues Repo:**
- Git-History bleibt erhalten (inkl. der bereits geleisteten Security-Fixes in v2)
- Vercel Preview-Deployments pro Commit auf v3-rebuild → du kannst jederzeit live schauen
- Kein Repo-Setup-Overhead
- v2 bleibt rollback-fähig bis zur Abnahme
- Nach Launch: `v3-rebuild` → `main` merge, v2-Tag wird zur Backup-Referenz

**Zwei parallele Streams vom Start weg:**
- **Stream DESIGN** (Sarah + ui-ux-pro-max Skill) — Design System, Tokens, Shared Components
- **Stream CODE** (Marcus, Elena, David) — Modul-Port aus v1, Backend, Security, Cross-Module

Zwei Streams bedeuten: kein Warten. Sarah definiert das Design-System während Elena Module portiert. Beide synchronisieren sich alle 1-2 Tage über David.

**Gesamtscope:** ~5-7 Wochen bei Maximum-Quality-Kurs.

---

## 1. Teamstruktur

| Rolle | Agent | Ownt |
|---|---|---|
| **Product Owner** | Mikail Suenger | WAS + WARUM + Gates |
| **Senior PM** | Süleyman | Scope, Prioritäten, Zeit, Gate-Freigabe-Vorschläge |
| **Engineering Director** | David Mueller | Architektur, Koordination, Quality Gate |
| **Design Lead** | Sarah Chen + `ui-ux-pro-max` Skill | Design-System, Tokens, Shared Components |
| **Frontend Module** | Marcus Weber | Alle Modul-Pages + Komponenten |
| **Backend / Security** | Elena Petrov | Server Actions, Auth, Stripe, Proxy, Sentry |
| **QA / Reliability** | James Park | E2E, RBAC-Matrix, Security-Tests, Performance |
| **DevOps / Infra** | Alex Nowak | Vercel, Env-Vars, CI/CD, Monitoring |
| **Content / UX-Texte** | Lena Fischer | UI-Texte, Legal, E-Mails, Onboarding |

---

## 2. Branch- und Deployment-Strategie

```
main (v2 — stable, deployed)
 └── v3-rebuild (wird v3)
      ├── v3-design-stream (Sarah's Changes, gemerged oft)
      └── v3-code-stream (Marcus/Elena/David, gemerged oft)
```

**Vercel:**
- `main` → `nomadworks-v2.vercel.app` (bleibt wie bisher = v2 live)
- `v3-rebuild` → `nomadworks-v2-v3-rebuild-*.vercel.app` (Preview pro Commit — du kannst live testen)
- **Bei Launch:** `v3-rebuild` → `main` merge → `nomadworksv3.vercel.app` oder Custom Domain
- **v1 offline:** Nach erfolgreicher Abnahme von v3 (Mikails Entscheidung #6)

---

## 3. Phasen-Roadmap

Jede Phase hat ein **Gate** — Mikail muss Go geben bevor nächste Phase startet (Entscheidung #7: Gate-by-Gate).

### 🔧 Phase T0 — Security-Fires auf v2 (heute, 30 min)
**Warum vor v3-rebuild:** Die Bugs sind in Prod. Wenn wir sie jetzt auf v2 fixen, landet der Fix automatisch auf v3 (wir forken gleich). Außerdem: v2 ist Fallback-Environment — muss stabil bleiben.

**Aktionen:**
- Task 1: `mapShiftTypeToDb` fix (`disposition.ts`) — createAssignment-Bug
- Task 3: Ghost-Company raus aus `auth.ts` **nach Verify** des `/auth/callback` Register-Pfades (Elenas Bonus-Finding #3)
- Commit + Push → Vercel deployt automatisch

**Gate T0:** TypeScript-Build grün + Disposition funktioniert in Prod.

---

### 🎨 Phase V3-0 — Setup & Design-Entscheidung (1 Tag)
**Ziel:** Branch aufsetzen, Design-Richtung festlegen, Team-Aufstellung finalisieren.

**Parallele Tasks:**

**Stream DESIGN (Sarah + ui-ux-pro-max Skill):**
- Via `Skill("ui-ux-pro-max")` Style-Vorschläge generieren basierend auf:
  - Persona: "Klaus, 52, GF Tiefbau, hasst Computer, will in 3s alles verstehen"
  - Domain: Baustelle, Mobile-First, Outdoor-tauglich
  - Konstanten: Next.js 16 + shadcn/ui + Tailwind + Dark Mode
- **Empfehlung (ohne weitere Info):** Bento Grid Layout + Minimalism + Professional Earth Tones (Bau-App-tauglich: Dunkelgrau/Anthrazit + Akzent-Orange für "Arbeiter" und Akzent-Grün für "läuft")
- Liefert: 3 Style-Konzepte als Mockups/Beschreibung → Mikail wählt

**Stream CODE (David + Elena + Alex):**
- `git checkout -b v3-rebuild` from `main` (nach T0-Commits)
- Alle 7 Agents als `.claude/agents/nomadworks/*.md` auf v3-rebuild verfügbar
- Vercel-Project-Setting: `v3-rebuild` als Preview-Branch aktivieren
- David schreibt `docs/v3/architecture.md` — Cross-Module Event-Layer Entwurf (sauber, weil Entscheidung #2 = B)

**Gate V3-0:** Mikail wählt Design-Konzept (oder gibt Sarah freie Hand). Branch läuft.

---

### 🎨 Phase V3-1 — Design System Refresh (2-3 Tage)
**Ziel:** Komplettes Design-System vor den Modul-Ports. So mappen Module beim Port sofort auf neue Tokens, kein doppelter Refactor.

**Sarah (Stream DESIGN):**
- Neue `app/globals.css` mit Tokens (Farben, Typo, Spacing, Radii, Shadows)
- Refresh aller shadcn/ui Komponenten
- Refresh Shared Components: `StatCard`, `StatusBadge`, `DataTable`, `EmptyState`, `CurrencyInput`, `AddressFields`, `ModulePageSkeleton`
- Layout-Shell: `Sidebar`, `Header`, `MobileNav`, `PageHeader`, `Breadcrumbs`
- Dark Mode (angenommen: ja, default light, toggelbar)
- Touch-Targets 48dp standard / 56dp für Baustellen-Screens

**James parallel:** Accessibility-Audit auf neuem Design-System (Lighthouse >95).

**Lena parallel:** Content-Review der existierenden Empty States + Tooltips. Liste aller Fachbegriffe die Tooltips brauchen (SV-Nr, SOKA, §48b, GAEB, VOB, §13b).

**Gate V3-1:** Design-System läuft auf mindestens 3 existierenden v2-Seiten (Dashboard, Baustellen, Stempeln) als Proof. Lighthouse A11y >95.

---

### 🔒 Phase V3-2 — Security + Disposition hardening in v3 (1 Tag)
**Ziel:** v3-rebuild erbt alle 10 v1-Security-Fixes + T0-Fixes, wird final secure.

**Elena:**
- Port aller T0-Fixes auf v3-rebuild (sollten schon drin sein via merge)
- Plus alle 10 v1-Lücken aus `elena-petrov.md` explizit pro Datei:Zeile abhaken
- `soka.ts` AnyRow → typisierte Rows (Bonus-Finding #1)
- `requestPasswordReset` hardcoded URL → `NEXT_PUBLIC_APP_URL` (David HIGH-Finding)
- `admin.ts` `verifySuperAdmin` → `withAuth("admin", "read")` Pattern (Bonus-Finding #4)

**James:** Security-Smoke-Test via OWASP-Checkliste.

**Gate V3-2:** 14 Security-Punkte alle auf ✅. Kein offener HIGH-Finding.

---

### 📦 Phase V3-3 — Modul Port: Lager & Einkauf (2-3 Tage)
**Grund Lager-zuerst (Entscheidung #3):** Blockt E2E-Flows K2/K3, simpler Cross-Module-Pfad, gutes Pilot-Modul für Portierungs-Muster.

**Marcus:**
- Port `app/(app)/lager/**` aus v1 (9 Pages: materialien, lieferanten, bestellungen, material_bundles)
- Umbau auf neue Sarah-Tokens + Shared Components
- Server Components by default, `"use client"` nur wo interaktiv

**Elena:**
- Port `lib/actions/inventory.ts` aus v1 → splitten + typisieren
- `withAuth` auf jede Action, `company_id` Filter konsequent
- `stock_movements` Trigger-Logik: Auto-Bestandsupdate bei Ein/Aus/Rückgabe

**Sarah:** Bei Bedarf Lager-spezifische Komponenten (z.B. `MaterialStockBadge`, `BundleBuilder`).

**Lena:** Texte für Empty States (`"Noch keine Materialien"` → `"Legen Sie Ihr erstes Material an um Bestände zu verwalten"`), Fachbegriff-Tooltips.

**James:** E2E-Tests für Lager (Anlegen, Bearbeiten, Löschen, Bestellung → Lager, Entnahme → Auftrag).

**Gate V3-3:** Lager voll funktional auf v3-rebuild Preview-URL. Mikail testet via Preview-Link.

---

### 🚚 Phase V3-4 — Modul Port: Fuhrpark (2-3 Tage)
**Umfang:** Fahrzeuge, Maschinen (ehem. Geräte), Werkstatt + asset_assignments für Fuhrpark-Standorte aus v1-Commit `Punkt 1`.

**Marcus:** Port `app/(app)/fuhrpark/**` (10 Pages).
**Elena:** Port `lib/actions/fleet.ts` + `equipment_costs`, `fuel_logs`, `trip_logs`, `workshop_entries`.
**Sarah:** Fuhrpark-spezifische Komponenten (z.B. `VehicleStatusCard`, `TÜVWarning`).
**Lena:** Texte + Tooltips (Leasing, Finanzierung, TÜV).
**James:** E2E.

**Gate V3-4:** Fuhrpark voll funktional + TÜV-Reminder-Flow getestet.

---

### 🤝 Phase V3-5 — Modul Port: Subunternehmer (1-2 Tage)
**Umfang:** Liste, §48b-Tracking, Einsätze, Bewertung. **Plus Fix:** `company_id` Filter auf Assignments (v1-Sicherheitslücke #2).

**Marcus + Elena + Sarah + Lena + James** — analog.

**Plus Elena:** §13b Reverse-Charge Logik aus v1 (`Update 6: §13b Reverse Charge für Subunternehmer`).

**Gate V3-5:** Sub + §48b + §13b funktional. `company_id` Filter verifiziert via James-Test.

---

### 🧬 Phase V3-6 — Cross-Module Event-Layer (2-3 Wochen)
**Die größte Phase.** Entscheidung #2 = Event-basiert sauber.

**David:** Architektur-Entwurf in `docs/v3/architecture.md`:
- Event-Types: `time_entry.created`, `material.withdrawn`, `vehicle.assigned`, `sub_assignment.created`, `invoice.created`
- Event-Store: dedizierte Supabase-Tabelle `domain_events`
- Subscriber-Pattern über Server Actions
- Aggregations-Layer: `order_costs`, `site_costs`, `employee_hours` mit Auto-Update
- Rollback-Strategie für fehlerhafte Events

**Elena (Week 1):** Event-Infrastructure, `domain_events` Tabelle, Base Publisher/Subscriber, erste Aggregationen (Zeit → Auftrag, Lager → Auftrag).

**Sub-Gate V3-6a (Ende Week 1):** Architektur-Reality-Check. David reviewt. Mikail gibt Go oder bremst.

**Elena (Week 2):** Restliche Aggregationen (Fuhrpark → Auftrag, Sub → Auftrag, Soft-Calculations).

**Marcus (Week 2):** Cross-Module UI-Widgets (Kostentracker-Card auf Dashboard, Nachkalkulation auf Baustellen-Detail).

**James (ganze Phase):** Event-Konsistenz-Tests, Race-Conditions, Idempotenz.

**Gate V3-6:** Kostentracker läuft automatisch. James zeigt dass kein Event verloren geht, keine Doppel-Buchung, Auto-Aggregationen korrekt.

---

### 👥 Phase V3-7 — Rollen-Ausbau (3-4 Tage)
**Entscheidung #1 = B:** 7 Rollen (super_admin, owner, foreman, worker, office, accountant, employee) — voll ausdifferenziert.

**Elena:** `checkModuleAccess` für jede Rolle explizit ausdefinieren. Permission-Tabellen.
**Marcus:** UI-Differenzierung: was sieht `office` vs. `accountant` vs. `employee`?
**Sarah:** Layout-Varianten falls nötig (z.B. `employee` hat evtl. gar keine ERP-Sidebar).
**James:** **Komplette RBAC-Matrix** — 7 Rollen × 14 Module × 4 Actions (read/create/edit/delete) = 392 Test-Punkte.

**Gate V3-7:** RBAC-Matrix 100% grün.

---

### 💳 Phase V3-8 — Stripe + Billing (1-2 Tage)
**Entscheidung #5 = B:** Stripe live ab Launch.

**Elena:**
- Webhook vollständig (Checkout, Subscription, Payment-Failed — schon da, nur verifizieren)
- Customer Portal Link
- Price-IDs: Starter, Business, Enterprise via Env-Vars
- Trial-Logik (14 Tage) + Upgrade-Flow

**Alex:**
- Vercel Env-Vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Test via Stripe CLI

**Lena:** Pricing-Page-Content, Trial-E-Mails, Payment-Failed-E-Mails.

**Gate V3-8:** Test-Checkout läuft E2E (Trial → Plan → Portal → Downgrade → Cancel).

---

### ⚖️ Phase V3-9 — Legacy-Features Port (2-3 Tage)
**v1-Features die nicht als "Modul" strukturiert sind aber in v3 rein müssen:**

- **SOKA-Bau CSV Export + Druck** (v1 `Update 0ea0f18b + 40efddb2`)
- **Bautagesbericht Druck-Layout + Foto-Upload** (v1 `Update cf1342ec`)
- **Auftrags-Nachträge / Change Orders** (v1 `Punkt 10 7a5f1dfb + Fix 9651bb80`)
- **Steuerberater-Export / accountant Role Zugriff** (v1 `Update A 4bccbd9d + Punkt 5/6/Fix`)
- **Nachkalkulation + Team-Tabs auf Baustellen-Detail** (v1 `Block 2 340704b7 + Block 3 06e9f17e`)
- **Aufmaß Tab** auf Baustellen-Detail (v1 `Punkt 7 72c749e1`)
- **Wochenplanung in Disposition** (v1 `Punkt 3 d30cb0d4 + Update 4 f6c56267`)

**Owner pro Feature:** Marcus (UI) + Elena (Backend) + Lena (Texte) nach bekanntem Muster.

**Gate V3-9:** Alle 7 Legacy-Features funktional, keines blockiert.

---

### 📜 Phase V3-10 — DSGVO, Legal, UX-Polish (2-3 Tage)
**Lena:**
- `app/(legal)/impressum/page.tsx` — echte Nomad Solutions Daten
- `datenschutz/page.tsx` — vollständig inkl. Cookie-Policy, Supabase, Sentry, Stripe, Vercel
- `agb/page.tsx` — SaaS-typisch, §14 AGB, DE-rechtskonform
- Cookie-Banner mit echtem Consent-Management (Opt-in für Sentry + Analytics)
- Onboarding-Flow Texte überarbeiten
- TipsBanner-Content
- E-Mail-Templates (Einladung, Trial, Rechnung, Reset)

**Sarah + Marcus:**
- Alle Empty States mit CTA
- Hover-Feedback + Loading-Skeletons final
- Mobile-Responsive Audit
- Dark Mode Feinschliff

**Gate V3-10:** DSGVO-Compliance-Check durch James. Alle Legal-Pages echt. Content vollständig auf Deutsch, Klaus-verständlich.

---

### 🏗️ Phase V3-11 — DevOps + Infrastructure (1 Tag)
**Alex:**
- Vercel Production-Project-Config für v3
- Alle Env-Vars auf Vercel: Supabase, Stripe, Sentry (inkl. `SENTRY_ORG` + `SENTRY_PROJECT` die aktuell fehlen), Resend, App-URL, Cron-Secret
- Sentry Source-Maps Upload aktivieren
- Cron Jobs via `vercel.json` verifiziert (Backup-Check, Trial-Check)
- Supabase Backup-Config prüfen
- Custom Domain Setup falls gewünscht

**Gate V3-11:** `v3-rebuild` Preview-URL läuft mit Production-Config. 14 Env-Vars alle da.

---

### ✅ Phase V3-12 — Final QA (2-3 Tage)
**James:**
- Komplette E2E-Suite via Playwright auf Preview-URL
- **RBAC-Matrix** (7 Rollen × 14 Module × 4 Actions = 392 Punkte, alle grün)
- DSGVO-Compliance: sensible Daten korrekt geschützt
- Performance: Lighthouse >90 auf allen Top-10-Routen
- Cross-Browser: Chrome, Firefox, Safari, Safari Mobile, alter Android
- Real-Device-Tests auf Baustellen-Screens (Touch, Handschuhe-Simulation, 3G)
- Security-OWASP Top 10 Durchgang

**David:** Final Architektur-Review.
**Süleyman:** Scope-Check — wurde alles was versprochen wurde geliefert?

**Gate V3-12:** Release-Abnahme-Protokoll signiert von James + David + Süleyman. Mikail gibt Launch-Go.

---

### 🚀 Phase V3-13 — Launch (1 Tag)
**Alex + David:**
- `v3-rebuild` → `main` merge (Fast-forward oder Squash je nach History)
- Production-Deploy via Vercel
- DNS/Domain-Switching falls custom
- v1 `nomadworks.vercel.app` bekommt Deprecation-Banner mit Redirect-Link
- Monitoring: Alle Alerts aktiv (Vercel + Sentry)
- Backup verifiziert
- 24h on-call

**Nach 1 Woche ohne kritische Incidents:**
- v1 offline setzen (Repo `seba-nomad/nomadworks` auf archived)

**Gate V3-13:** v3 läuft stabil 7 Tage. v1 kann offline.

---

## 4. Gesamtdauer (realistische Schätzung bei Maximum-Quality)

| Phase | Dauer |
|---|---|
| T0 Security-Fires | 0,5 Tag |
| V3-0 Setup | 1 Tag |
| V3-1 Design System | 2-3 Tage |
| V3-2 Security v3 | 1 Tag |
| V3-3 Lager | 2-3 Tage |
| V3-4 Fuhrpark | 2-3 Tage |
| V3-5 Subunternehmer | 1-2 Tage |
| V3-6 Cross-Module Events | **2-3 Wochen** |
| V3-7 Rollen-Ausbau | 3-4 Tage |
| V3-8 Stripe | 1-2 Tage |
| V3-9 Legacy-Features | 2-3 Tage |
| V3-10 DSGVO/Legal/UX | 2-3 Tage |
| V3-11 DevOps | 1 Tag |
| V3-12 Final QA | 2-3 Tage |
| V3-13 Launch | 1 Tag |
| **Gesamt** | **~5-7 Wochen** |

**Kritischer Pfad:** Phase V3-6 (Cross-Module Events). Hier entstehen die größten Unbekannten — deshalb zwei Sub-Gates (Week 1 + Week 2).

---

## 5. Risiken & Mitigations

| # | Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Cross-Module Event-Layer unterschätzt | Hoch | Hoch | Sub-Gate nach Week 1, Option auf Rückzug zu pragmatischer Lösung in Notfall |
| 2 | Design-System blockiert Modul-Port | Mittel | Mittel | Design-System zuerst (V3-1), dann Module |
| 3 | v1-Port bringt v1-Bugs mit | Hoch | Mittel | Elena reviewt jede portierte Action gegen 10-Punkt-Security-Liste |
| 4 | Mikail überfordert mit 13 Gates | Mittel | Niedrig | Süleyman schlägt Gate-Bundles vor wenn Fortschritt flüssig |
| 5 | Sentry + DevOps-Lücken blockieren Launch | Niedrig | Hoch | Alex frühzeitig in V3-0 reinziehen |
| 6 | Stripe Test-Mode → Live-Mode Migration | Niedrig | Hoch | Vollständige Test-Checkout-Matrix in V3-8 |
| 7 | Persona-Check fehlschlägt ("Klaus versteht's nicht") | Mittel | Mittel | Lena + Sarah machen in V3-10 einen echten Klaus-Test |

---

## 6. Konkrete erste Aktionen (heute)

1. **Mikail:** diesen Plan freigeben (Go / No-Go / Ändern)
2. **Main-Session-Claude:** T0-Fixes anwenden auf `main` (`mapShiftTypeToDb` + Ghost-Company nach Callback-Verify)
3. **Main-Session-Claude:** `git checkout -b v3-rebuild` + push → Vercel aktiviert Preview
4. **Sarah + ui-ux-pro-max Skill:** Design-Konzepte generieren (parallel) → Mikail wählt
5. **David:** `docs/v3/architecture.md` Entwurf für Event-Layer (vorbereitend)
6. **Alex:** Vercel Preview-Branch-Config + fehlende Env-Vars (`SENTRY_ORG`, `SENTRY_PROJECT`) auf v2 setzen
7. **Süleyman:** Phase V3-0 Dispatch-Plan bestätigen, Gate-Definitions vorlegen

---

## 7. Was Mikail entscheiden muss

- **Go auf diesen Plan?** → Alles andere folgt automatisch
- **Design-Richtung freigeben oder an Sarah delegieren?** → Wenn delegiert: Sarah wählt Style via Skill basierend auf Persona + Domain
- **Custom Domain für v3?** → z.B. `app.nomad-solutions.de`? Oder `nomadworks.vercel.app` weiter nutzen?
- **Nomad Solutions rechtliche Daten** für Impressum (in V3-10): Adresse, HRB, UST-ID, Kontakt-Email

Nichts davon blockiert den Start. Nur der Plan-Go ist kritisch.
