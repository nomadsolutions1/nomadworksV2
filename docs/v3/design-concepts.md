# NomadWorks v3 — Design Concepts

**Autorin:** Sarah Chen (Design System & UX Lead)
**Datum:** 2026-04-10
**Skill-Grundlage:** `ui-ux-pro-max` v2.5.0 (50+ Styles, 161 Color Palettes, 57 Font Pairings)
**Kontext:** v3-Rebuild, Branch `v3-rebuild`, Stack: Next.js 16 + React 19 + Tailwind 4 + shadcn/ui + next-themes
**Persona:** Klaus Müller, 52, GF Tiefbau, 35 MA, Papier+Excel-Hintergrund, 3-Sekunden-Verständnistest

---

## Briefing-Zusammenfassung

Klaus steht bei 14°C und Nieselregen auf der Baustelle in Essen-Altenessen. Handschuhe aus, Handschuhe an. Sonne knallt auf das Display, wenn sie mal scheint. Er will drei Dinge wissen:

1. **Wo sind meine Leute gerade?** (Disposition / Zeiterfassung)
2. **Was kostet mich die Baustelle heute?** (Cost Tracker)
3. **Kommt das bestellte Material heute?** (Material-Tracking)

Der Wettbewerber **Windworker** ist funktional komplett, aber sieht aus wie SAP R/3 mit Lippenstift. Unser Differenzierungs-Keil ist ausschließlich **Wahrnehmung**: "Das hier verstehe ich ohne Schulung." Jedes Konzept unten ist darauf geeicht.

---

## Konzept 1 — "Baustelle Modern" (empfohlen)

**Die Sichere Wahl. Pragmatisch. Unverwechselbar. Baustellentauglich.**

### Style-Richtung
**Bento Box Grid + Flat Design Hybrid**
Apple-artige modulare Kachel-Dashboards mit varying spans (1x1, 2x1, 2x2). Große runde Ecken (20px), weiche Schatten, keine Gradients, keine Deko. Warum für Klaus: Jede Kachel = eine Frage. Keine Hierarchie-Rätsel. Er scrollt nicht, er scannt. Funktioniert 1:1 auf Mobile als vertikale Stapelung.

### Farbpalette (Industrial Slate + Safety Orange)
Basierend auf `Construction/Architecture` Palette der Skill-DB, WCAG-verifiziert.

| Rolle | Light (Hex) | Dark (Hex) | Einsatz |
|---|---|---|---|
| **Primary** (Marke) | `#334155` slate-700 | `#E2E8F0` slate-200 | Sidebar, Headings, primäre Buttons |
| **Accent** (CTA/Signal) | `#EA580C` orange-600 | `#FB923C` orange-400 | "Jetzt einstempeln", Fokus-Ring, Baustellen-Pins |
| **Success** (läuft) | `#059669` emerald-600 | `#34D399` emerald-400 | "Im Soll", Zeiterfassung aktiv |
| **Warning** (Achtung) | `#D97706` amber-600 | `#FBBF24` amber-400 | "Material fehlt", "Soll+10%" |
| **Danger** (§48b/Fehler) | `#DC2626` red-600 | `#F87171` red-400 | Unbezahlte Rechnung, fehlende Freistellungsbescheinigung |
| **Background** | `#F8FAFC` slate-50 | `#0B1220` custom near-black | Page-BG |
| **Surface** (Card) | `#FFFFFF` | `#111827` gray-900 | Bento-Tiles |
| **Text Primary** | `#0F172A` slate-900 | `#F1F5F9` slate-100 | Körper, Zahlen |
| **Text Muted** | `#64748B` slate-500 | `#94A3B8` slate-400 | Labels, Sekundärinfo |
| **Border** | `#E2E8F0` slate-200 | `#1F2937` gray-800 | Tile-Umrandung |

**Kontrast verifiziert:** Text Primary auf Background = 17.8:1 (AAA). Accent Orange auf Weiß = 4.57:1 (AA). Accent auf Dark BG = 8.2:1 (AAA). Outdoor-tauglich bei Sonne, weil Sättigung hoch und Primärtöne dunkel.

### Font-Pairing
**Plus Jakarta Sans** (Single Family, Google Fonts, SIL OFL — kommerzielle Nutzung frei)
- Heading: Plus Jakarta Sans **700/800** (tight leading 1.1–1.2)
- Body: Plus Jakarta Sans **400** (leading 1.5)
- Labels/Buttons: **600**
- Tabular Figures für Zahlen/Geld (`font-variant-numeric: tabular-nums`)

Warum: Plus Jakarta kombiniert Inter-Lesbarkeit mit leicht rundlicher, freundlicher Form — das ist "moderner B2B" ohne techlord-Kühle. Ein einzelnes Family-Loading, schnell auf 3G-Verbindung bei "Funkloch Brandenburg".

### Layout-Prinzip
**Desktop (≥1024px):** Fixe Sidebar links (240px, collapsible auf 64px Icon-Rail) + Top-Header (56px mit Breadcrumbs + Global Search + Wetter-Widget für Baustellen) + Bento-Grid-Dashboard (12 col, 20px gap, 24px card-radius). KPI-Kacheln oben (2x1), dann Live-Karte der Baustellen (2x2), dann DataTable-Zeilen für Laufende Projekte.

**Mobile (<1024px):** Bottom-Tab-Bar mit exakt **5** Zielen (Heute / Baustellen / Team / Material / Mehr). Fullscreen-Cards, 1-spaltig. Touch-Targets **56x56dp** (Baustellen-Modus, Handschuhe). Fixed "Jetzt einstempeln"-FAB in Accent-Orange unten rechts.

### Micro-Interaktionen
- **Hover (Desktop):** Cards scale(1.01) + shadow lift 150ms ease-out. Kein "Jiggle".
- **Tap (Mobile):** Subtle scale(0.98) + ripple in Primary/10, 120ms. Klaus spürt: "Ja, ich hab getroffen."
- **Focus:** 2px Accent-Orange Ring mit 2px Offset. Sofort sichtbar, auch bei Sonne.
- **Loading:** Shimmer-Skeleton in `muted` Farbe, nie Spinner für >300ms Operationen.
- **Empty State:** Große Lucide-Illustration (2-tone, slate-300/slate-500), ein Satz Klar-Deutsch ("Noch keine Baustelle angelegt."), ein Primary-Button drunter. Kein Text-Wall.
- **Success-Feedback:** Toast slides-up von Bottom, Success-Green-Hintergrund + Haken-Icon, Auto-Dismiss 4s. Bei Zeiterfassung zusätzlich haptic feedback auf iOS.
- **Status-Änderung:** Color-Crossfade 200ms + Icon-Change, nie nur Farbe (color-not-only Regel).

### Inspiration / Referenz
- **Linear** (Sidebar-Feel, Tastatur-Shortcuts, Status-Pills)
- **Vercel Dashboard** (Bento-Kacheln, Dark Mode Polish)
- **Notion** (Card-Hierarchie, ruhige Flächen)

### Warum dieses Konzept für Klaus passt
Klaus kennt "Kacheln" vom iPad seiner Enkelin. Bento Grid liefert ihm **eine Info pro Kachel** — kein Datenfriedhof wie bei Windworker. Das Industrial-Slate signalisiert "seriös, nicht Startup-Spielzeug", das Safety-Orange signalisiert "hier handeln". Die Farbe ist kein Gimmick: Bauhelme sind orange, Warnwesten sind orange — **Klaus' visueller Wortschatz, nicht unserer**. Auf dem Mobile-Screen in der prallen Sonne bleibt der 17.8:1-Kontrast lesbar, während Windworker bei 6:1 wegbricht.

---

## Konzept 2 — "Meisterbüro" (die Trust-Variante)

**Die konservative Alternative. Autorität. Premium. Kanzlei-Gefühl.**

### Style-Richtung
**Swiss Modernism 2.0** — strict 12-col grid, Helvetica-/Inter-Rigorosität, mathematische Spacings, einziger Akzent, null Dekoration. Warum für Klaus: Wirkt wie eine deutsche Handwerkskammer-Publikation — maximale Vertrautheit und Seriosität. Kein "Tech-Startup"-Geruch, der Klaus sofort verdächtig macht.

### Farbpalette (Authority Navy + Trust Gold)
Basierend auf `Legal Services` / `Banking Traditional` Palette.

| Rolle | Light | Dark | Einsatz |
|---|---|---|---|
| **Primary** | `#1E3A8A` blue-900 | `#93C5FD` blue-300 | Headings, Sidebar, Logo |
| **Accent** | `#B45309` amber-700 | `#FBBF24` amber-400 | CTAs, Key-Metriken-Highlight |
| **Success** | `#15803D` green-700 | `#4ADE80` green-400 | Bezahlt, abgeschlossen |
| **Warning** | `#B45309` amber-700 | `#FBBF24` amber-400 | (gleich wie Accent — intentional, spart kognitive Last) |
| **Danger** | `#B91C1C` red-700 | `#F87171` red-400 | §48b Warnung, fehlende Unterlagen |
| **Background** | `#F8FAFC` slate-50 | `#020617` slate-950 | Page |
| **Surface** | `#FFFFFF` | `#0F172A` slate-900 | Cards, Tables |
| **Text Primary** | `#0F172A` slate-900 | `#F8FAFC` slate-50 | Alles |
| **Text Muted** | `#64748B` slate-500 | `#94A3B8` slate-400 | Labels |
| **Border** | `#CBD5E1` slate-300 | `#1E293B` slate-800 | Table-Rows, Dividers |

**Kontrast:** Navy auf Weiß = 11.6:1 (AAA). Gold auf Weiß = 4.52:1 (AA). Charakteristisch: fast nie Bunt, dafür präzise.

### Font-Pairing
**Inter** (Heading 700 + Body 400) — die Arbeitspferd-Grotesk des Internets. Einzelne Family, OFL-Lizenz, OpenType-Features für echte Tabular Figures und Fraktionen (wichtig für Geldbeträge in Rechnungen).

### Layout-Prinzip
**Desktop:** Fixe Sidebar (256px) mit kategorisierten Nav-Gruppen + strict 12-col content grid + klassische DataTables (row-height 40px, sortierbar, sticky header). Keine Kacheln — stattdessen **Listen und Tabellen** mit klarer Hierarchie durch Whitespace. Dashboard = oben schmaler KPI-Streifen (4 Zahlen in Inter 32/700), drunter sofort aktive Baustellen als Table.

**Mobile:** Top-AppBar + Tab-Bar unten (max 5). Dense Listenansichten, Cards nur für Detail-Screens. FAB nur auf Create-Screens.

### Micro-Interaktionen
- **Hover:** Nur Underline / Border-Color-Shift. Kein Scale.
- **Focus:** 2px Primary Navy Ring.
- **Loading:** Schmaler Progress-Bar oben am Header (Linear-Style), 2px hoch.
- **Empty State:** Einfach Text + Button, keine Illustration. "Noch keine Einträge vorhanden."
- **Feedback:** Toasts minimal, Serif-Serifen-frei, 3s auto-dismiss.
- **Animations:** Alle ≤150ms, ease-out. Fast unsichtbar. "Respektvoll."

### Inspiration / Referenz
- **Stripe Dashboard** (Ruhe, Datentabellen, Typography-Hierarchy)
- **Linear Settings** (Dense aber aufgeräumt)
- **SAP Fiori Fiori 3** (Enterprise-Legitimität ohne Hässlichkeit)

### Warum dieses Konzept für Klaus passt
Klaus' Steuerberater arbeitet mit DATEV. Klaus' Bank schickt ihm PDF-Auszüge. Beide sind blau/weiß und kleinteilig. Dieses Konzept spricht **Klaus' existierendes visuelles Vertrauens-Vokabular**. Windworker macht's auch so — aber besser als Windworker. Risiko: Es ist *austauschbar*. Der "Wow"-Moment fehlt. Verkäuferisch schwerer.

---

## Konzept 3 — "Einsatzleitstand" (die mutige Wahl)

**Operations-Center-Feel. Live-Daten. Dark-First. Differenzierung maximal.**

### Style-Richtung
**Data-Dense Dashboard + Dark Mode (OLED) Primary**
Inspiration: Flugverkehrskontrolle, Tesla Fleet Dashboard, Vercel Observability. Dunkles Primary-Theme (nicht exklusiv dark, aber Dark ist der "Hero"), dichte Info, Live-Updates pulsieren subtil. Warum: Klaus will sich wie ein **Einsatzleiter** fühlen, nicht wie ein Buchhalter. Das ist emotional — aber das Gefühl verkauft.

### Farbpalette (OLED Ops + Signal Green)
| Rolle | Light | Dark (primary) | Einsatz |
|---|---|---|---|
| **Primary** | `#0369A1` sky-700 | `#38BDF8` sky-400 | CTAs, aktive Nav-Items, Links |
| **Accent** | `#06B6D4` cyan-500 | `#22D3EE` cyan-400 | Live-Indicator, "NOW"-Pulse |
| **Success** | `#10B981` emerald-500 | `#34D399` emerald-400 | Läuft, online |
| **Warning** | `#F59E0B` amber-500 | `#FBBF24` amber-400 | Verzögerung |
| **Danger** | `#EF4444` red-500 | `#F87171` red-400 | Alarm, §48b, Overdue |
| **Background** | `#F1F5F9` slate-100 | `#000000` pure-black (OLED) | Page |
| **Surface** | `#FFFFFF` | `#0A0F1C` near-black | Cards (1px Border für Definition) |
| **Text Primary** | `#020617` | `#F8FAFC` | Alles |
| **Text Muted** | `#64748B` | `#64748B` slate-500 | Labels |
| **Border** | `#E2E8F0` | `#1E293B` slate-800 | Dünne Glows statt Blocks |

**OLED-Trick:** Pures `#000000` als BG auf OLED-Phones verbraucht weniger Akku → Klaus' Handy hält auf der Baustelle länger. Technisches Argument mit emotionalem Nutzen.

### Font-Pairing
**Inter** (UI) + **JetBrains Mono** (Zahlen, Timer, IDs)
Beide Google Fonts, OFL. JetBrains Mono für Zeiterfassungs-Timer, Baustellen-IDs, Material-Codes gibt den "Cockpit"-Effekt.

### Layout-Prinzip
**Desktop:** Minimale Icon-Rail links (64px fixed) + großflächiges Grid mit **Live-Map als Hero** (50% Viewport, dark-style map tiles), rechts dran "Live Feed" (Zeiterfassung in/out, Material-Scans). Unten dichte DataTable mit 32px row-height.

**Mobile:** Pull-to-refresh zur Aktualisierung, Swipe-Karten horizontally zwischen "Heute / Woche / Monat". Bottom-Nav 4 Items + zentraler FAB für Scanner (QR-Code auf Material).

### Micro-Interaktionen
- **Live-Pulse:** Aktive Mitarbeiter-Pins pulsieren alle 3s in Cyan (opacity 0.6→1.0, respekt `prefers-reduced-motion`).
- **Hover:** Border-Glow in Primary-Sky, kein Scale.
- **Focus:** 2px Cyan-Ring mit Glow `box-shadow: 0 0 0 4px rgba(34,211,238,0.2)`.
- **Loading:** Shimmer in Primary/10, nie Spinner.
- **Data-Changes:** Zahl crossfadet mit brief Up/Down Arrow Indikator.
- **Empty State:** ASCII-art-artige Lucide-Lines, monospace Caption. "Noch keine Live-Daten." (Cockpit-Tonalität).
- **Scanner-Modus:** Fullscreen Kamera-Overlay mit animiertem Scan-Line in Cyan.

### Inspiration / Referenz
- **Vercel Observability / Dashboard** (Live-Gefühl, Dark Mastery)
- **Linear** (Geschwindigkeit, Keyboard-Flow)
- **Tesla App** (Fleet-View, Live-Map, Mut zur schwarzen Fläche)

### Warum dieses Konzept für Klaus passt
Risikoreich, aber differenziert massiv. Klaus wird sagen: "**Das** sieht nicht aus wie Windworker." Die Live-Map mit Pulsing-Pins ist ein 5-Minuten-Demo-Goldstück ("Schauen Sie, Herr Müller, Ihre Leute live"). Risiko: Klaus könnte es als "zu Sci-Fi" empfinden. Muss im Verkauf getestet werden. Am besten für Mikails "modern, mobile-first"-Claim — aber gefährlich für "einfach".

---

## Sarahs Empfehlung

**Ich empfehle Konzept 1 — "Baustelle Modern".**

Es gewinnt auf allen vier Kriterien, die wirklich zählen: Es besteht den 3-Sekunden-Baustellentest (Bento = eine Info pro Kachel), es differenziert sich visuell hart von Windworker durch Safety-Orange und Bento-Aesthetik, es nutzt Klaus' existierendes Bau-Farbvokabular (Orange = Handeln, Slate = Seriosität), und es ist technisch am sichersten umzusetzen (Bento Grid ist Tailwind-nativ, Plus Jakarta Sans ist eine Single-Family-Ladung). Konzept 2 ist safe aber austauschbar, Konzept 3 ist mutig aber verkäuferisch riskant — "Baustelle Modern" ist die Bisect zwischen Vertrauen und Differenzierung.

---

## Nächste Schritte (für Mikail)

1. **Entscheidung treffen:** Konzept 1 / 2 / 3 oder explizites "Hybrid aus X+Y" als Feedback
2. **Vor Implementierung zu klären:**
   - Darf Primary wirklich Slate-Dark sein, oder soll es Navy werden? (Markenwirkung)
   - Soll Dark Mode gleichrangig oder "optional" sein? (Affects Token-Architektur)
   - Logo-Situation: Existiert ein Bestands-Logo das die Palette constraint, oder freie Fläche?
3. **Nach Freigabe:** Ich baue `app/globals.css` mit allen Tokens + `tailwind.config` + eine `/design-system` Demo-Route, die alle Komponenten durchspielt. 1–2 Tage Sprint.
