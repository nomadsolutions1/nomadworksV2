# NomadWorks v2 — Mikails Entscheidungen

**Datum:** 2026-04-11
**Entschieden durch:** Mikail Suenger (Product Owner, CEO)
**Grundlage:** Süleyman Strategic Assessment + David Technical Assessment

---

## Getroffene Entscheidungen

| # | Frage | Entscheidung | Konsequenz |
|---|---|---|---|
| 0 | Phase T0 sofort starten? | **JA** | Elena führt T0-Fixes aus, bevor Strategie-Phasen starten |
| 1 | Rollen-Modell | **B — 7 Rollen behalten** | office, accountant, employee müssen richtig ausgebaut werden (3-4 Tage). Kein Cleanup auf 4. |
| 2 | Cross-Module-Architektur | **B — Sauber, Event-basiert** | Service-Layer mit Events (~3 Wochen). Kein pragmatischer MVP-Shortcut. |
| 3 | Modul-Reihenfolge | **A — Lager zuerst** | Lager → Fuhrpark → Subunternehmer. Blockierende E2E-Bugs zuerst. |
| 4 | Launch-Strategie | **A — Voll portieren** | 10-12 Tage, alles drin. Kein Soft-Launch mit Coming-Soon-Platzhaltern. |
| 5 | Stripe-Billing | **B — Stripe ab Launch aktiv** | Stripe-Integration + Webhook + Price-IDs müssen vor Launch vollständig funktionieren. |
| 6 | v1-Abschaltung | **Nach v2-Launch** | `nomadworks.vercel.app` (v1) bleibt live bis v2 abgenommen ist. |
| 7 | Budget-Freigabe | **A — Gate-by-Gate** | Nach jeder Phase Go/No-Go durch Mikail. Kein en-bloc-Durchwinken. |

---

## Ableitungen für das Team

### Scope-Implikationen
- **Maximum Quality, keine Shortcuts.** Mikail hat konsequent die aufwändigere, saubere Option gewählt.
- **Realistischer Gesamtscope:** ~3-5 Wochen bis Launch (Phase A bis H vollständig).
  - T0: 1 Tag (Elena)
  - T1 Lager: 2-3 Tage (Marcus + Elena)
  - T2 Fuhrpark: 2-3 Tage (Marcus + Elena)
  - T3 Subunternehmer: 1-2 Tage (Marcus + Elena)
  - T4 Cross-Module (sauber, Events): ~3 Wochen (David Architektur + Elena Implementation)
  - T5 Rollen-Ausbau (office/accountant/employee): 3-4 Tage (Elena + Marcus + Sarah)
  - T6 Stripe-Integration vollständig: 1-2 Tage (Elena + Alex)
  - T7 DSGVO/Legal/UX-Polish: 2-3 Tage (Lena + Sarah)
  - T8 Regressions-Testing + RBAC-Matrix: 2 Tage (James)

- **Parallelisierung:** Lager/Fuhrpark/Sub sind sequentiell (nur 1 Frontend-Agent Marcus). Content (Lena), Design (Sarah), DevOps (Alex), QA (James) können parallel arbeiten wo Scope unabhängig ist.

### Feedback-Gates (Mikail muss Go geben)
- **Gate T0 → T1:** Nach T0-Completion. Elena liefert Report, Mikail entscheidet.
- **Gate T1 → T2:** Nach Lager-Port.
- **Gate T2 → T3:** Nach Fuhrpark-Port.
- **Gate T3 → T4:** Nach Subunternehmer-Port. **Kritisch**, weil T4 die größte Phase ist (3 Wochen Event-Architektur).
- **Gate T4 → T5-T8:** Nach Cross-Module-Layer steht.
- **Gate T8 → Launch:** Final Release-Gate nach RBAC-Matrix-Abnahme durch James.

### Offene Fragen (noch nicht beantwortet)
- Harte Deadline? → offen, angenommen "so früh wie möglich ohne Qualitätsverlust"
- Parallele Projekte die Team-Zeit wegnehmen? → offen
- Pilotkunde? → offen, könnte Modul-Reihenfolge nochmal umstoßen falls Pilotkunde Fuhrpark-zentriert ist

---

## Phase T0 Scope (freigegeben — Elena führt aus)

Strikt nur diese 4 Tasks. Nichts darüber hinaus.

### Task 1: `createAssignment` Bug fix (kritisch)
- **Datei:** `lib/actions/disposition.ts:266-284`
- **Hypothese:** `schedule_entries_shift_check` CHECK-Constraint in Supabase kennt v2-Enum-Werte nicht (`frueh|spaet|nacht|custom`)
- **Fix-Option A:** SQL-Migration die den CHECK erweitert
- **Fix-Option B:** Mapping in `mapShiftTypeToDb()` anpassen
- **Verifikation:** Test-Insert in Production nach Deploy

### Task 2: Worker-Stempelflow verifizieren
- **Referenz-Commit in v1:** `391ca061` "Stempeluhr zeigt jetzt Baustellen für Arbeiter an"
- **Verifikation:** Als Worker einloggen → `/zeiterfassung` oder `/stempeln` → Baustellen-Liste muss sichtbar sein
- **Wenn kaputt:** Sofort fixen (höchste Prio — Produkt ist sonst für 80% der User unbenutzbar)

### Task 3: Ghost-Company Auth-Lücke schließen
- **Datei:** `lib/actions/auth.ts:46-92`
- **Problem:** Login-Flow legt Company + Profile an wenn keines existiert, ohne Rate-Limit / Captcha / Email-Verify
- **Fix:** Logik aus Login rausnehmen → nur in Register-Flow und Invite-Callback erlauben
- **Prüfung:** Test-Login mit nicht-existentem User darf KEINE neue Company erstellen

### Task 4: Security-Audit der 4 offenen Punkte
- **4.1** `lib/actions/soka.ts` — `withAuth("mitarbeiter", "read")` vorhanden?
- **4.2** Admin `listUsers` — Firmenfilter aktiv?
- **4.3** Stripe-Webhook (`app/api/webhooks/stripe/route.ts`) — Signature-Verification korrekt?
- **4.4** `/api/*` Routes — Auth-Check im Handler?
- **Output:** Liste mit Datei:Zeile + Status (OK/FIX_NEEDED) + konkretem Fix-Vorschlag

### Regel für Elena
- **Kein Scope-Creep.** Nur diese 4 Tasks.
- Nach Abschluss: Report unter `docs/v2-rebuild/phase-t0-report.md` + Commit mit sauberer Message + Push + Vercel-Deploy auslösen.
- Bei Unklarheiten: Eskalation an David (über Main-Session-Loop).
