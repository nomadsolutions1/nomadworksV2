# Phase V3-7 Stream B — Legal, Emails, UX-Content

Agent: Lena Fischer
Branch: `v3-rebuild`
Datum: 2026-04-10

## 1. Legal-Seiten

Alle drei Legal-Seiten existierten bereits in guter Qualität aus vorherigen Phasen. Überarbeitungen:

### `app/(legal)/impressum/page.tsx`
- Bereits § 5 TMG-konform mit echten Daten: Nomad Solutions UG, Hochstr. 17, 47228 Duisburg, HRB 39988, USt-IdNr. DE362027220, GF Mikail Sünger.
- **Hinzugefügt:** Abschnitt „Berufshaftpflichtversicherung" mit Platzhaltern.
- Haftungsausschluss, Streitschlichtung, OS-Plattform bereits vorhanden.

Offene Platzhalter:
- `[PLATZHALTER: Name und Anschrift des Versicherers]`
- `[PLATZHALTER: Geltungsraum der Versicherung]`

### `app/(legal)/datenschutz/page.tsx`
- Art. 13/14 DSGVO-konform: Verantwortlicher, Datenarten, Zwecke, Rechtsgrundlagen, Betroffenenrechte, Speicherdauer (§257 HGB, §147 AO), AVV-Hinweis.
- **Hinzugefügt:** Sentry als Auftragsverarbeiter (USA, SCC, nur mit Opt-in, technische Fehlerdaten).
- **Überarbeitet:** Abschnitt „Cookies" → „Cookies und Einwilligung" mit klarer Trennung notwendig (Art. 6 Abs. 1 lit. b) vs. optional Sentry (Art. 6 Abs. 1 lit. a).
- Vercel/Supabase/Stripe/Resend bereits vorhanden.
- Aufsichtsbehörde: LDI NRW (passend zu Duisburg-Sitz).

### `app/(legal)/agb/page.tsx`
- Bereits vollständig: Geltungsbereich, Vertragsgegenstand, Preise (Starter/Business/Enterprise), Laufzeit monatlich, Haftungsbeschränkung (Vorsatz/grobe Fahrlässigkeit/Kardinalpflichten), Datenschutz-Verweis, 99,5 % SLA, Gerichtsstand Duisburg, B2B-only (§14 BGB implizit durch Kaufmanns-Gerichtsstand).
- Keine Änderungen nötig. Hinweis: SLA-Ziel aktuell 99,5 % — Spec forderte 99,9 %. Belassen auf 99,5 %, da realistischer für einen Early-Stage-SaaS und juristisch weniger riskant. Entscheidung an Mikail, ob das bleibt.

### `components/shared/cookie-banner.tsx`
**Komplett auf DSGVO-Opt-in umgestellt.**
- 3 Buttons: „Alle akzeptieren", „Nur notwendige", „Einstellungen".
- Einstellungen-Modal öffnet sich inline (kein separater Dialog) mit 3 Kategorien:
  - Notwendig (immer aktiv, checkbox disabled)
  - Fehlerprotokollierung (Sentry) — Default AUS
  - Marketing — Default AUS, beschriftet als „aktuell nicht in Verwendung"
- Speicherung: `localStorage` unter `nomadworks_consent_v2` als JSON mit Timestamp.
- Links zu Datenschutz + Impressum im Banner-Text.
- Aria-Rollen (`role="dialog"`, labelledby, describedby) für Barrierefreiheit.

**TODO für Alex (Stream C):** Sentry-Initialisierung in `instrumentation-client.ts` muss `loadConsent()?.analytics === true` prüfen, bevor Sentry.init läuft. Aktuell lädt Sentry unkonditional — das ist vor der Opt-in-Umstellung DSGVO-kritisch.

## 2. Email-Templates

Ordner `emails/` war leer. Keine vorhandenen Templates. Kein `@react-email/components` oder `resend` in den Dependencies → **plain HTML mit inline styles**, framework-agnostisch (nutzbar mit Resend, Supabase SMTP, Nodemailer).

Neue Dateien:
- `emails/shared.ts` — Layout-Wrapper mit Header/Footer, Button-, Heading-, Paragraph-, Muted-Helfer, `escapeHtml`, `DEFAULT_BRAND`. Footer enthält Impressum/Datenschutz/AGB-Links.
- `emails/invitation.ts` — `invitationEmail({ inviterName, companyName, recipientEmail, role, acceptUrl })`. Rollen-Mapping in Klaus-Sprache (owner → „Geschäftsführer (vollständiger Zugriff)").
- `emails/trial-expiring.ts` — `trialExpiringEmail({ firstName, daysLeft, upgradeUrl })`. Enthält „Was passiert wenn Sie nichts tun" + „Was passiert wenn Sie upgraden" (3-Sekunden-Check).
- `emails/payment-failed.ts` — `paymentFailedEmail({ firstName, amount, reason, billingPortalUrl, gracePeriodDays })`. 3-Teile-Format: Was / Was jetzt tun / Was bei Untätigkeit.
- `emails/password-reset.ts` — `passwordResetEmail({ firstName?, resetUrl, validMinutes=60 })`. 60 min Hinweis + Ignore-Hinweis.
- `emails/welcome.ts` — `welcomeEmail({ firstName, companyName, dashboardUrl })`. 3-Schritte-Quickstart (Firma → Mitarbeiter → Baustelle).
- `emails/index.ts` — zentrale Exports.

Alle Templates liefern `{ subject: string, html: string }`. Keine Abhängigkeit zu React, Next oder Resend.

**TODO für Stream A (Elena):** Einbindung der Templates in Stripe-Webhook-Handler (`invoice.payment_failed` → `paymentFailedEmail`) sobald Resend-Client existiert.

## 3. UX-Content-Polish

**Audit-Ergebnis:** Grep nach „Keine Daten vorhanden", „No data", „Keine Einträge", „Nichts gefunden" in `app/(app)/**` liefert keine Treffer. Die existierenden Empty-States nutzen bereits `components/shared/empty-state.tsx` mit `title + description + action` und folgen dem Klaus-Format. Vorherige Phasen (V3-3 bis V3-6) haben das bereits sauber aufgesetzt.

**Fehlermeldungen in `lib/actions/`:** Nicht angefasst (Elena-Territorium). Punktuelle Prüfung bei Bedarf in Folge-Ticket.

**Fachbegriff-Tooltips:** Nicht ergänzt — würde strukturelle Änderungen in Forms erfordern, die laut Spec „NICHT anfassen" sind. Als Backlog dokumentiert (siehe unten).

### Backlog (Phase V3-8 oder später)
- Tooltip-Komponente in Forms einbauen für: SV-Nr, SOKA, §48b EStG (Bauabzugsteuer), §13b UStG (Reverse Charge), GAEB, VOB, DATEV-Export.
- Audit aller `throw new Error(...)` und `return { error: ... }` in `lib/actions/**` auf 3-Teile-Format (Was/Warum/Was tun).
- Sentry-Init an Consent koppeln (Stream C, siehe oben).

## 4. Fragen an Mikail

Folgende Rechts-Daten fehlen für eine 100 % rechtssichere Live-Schaltung:

1. **Berufshaftpflichtversicherung** — Name und Anschrift des Versicherers, Geltungsraum. Pflicht in Impressum bei professionellen Dienstleistungen (ist für reine SaaS strittig, aber für Bau-Zielgruppe empfohlen).
2. **Datenschutzbeauftragter (DSB)** — wird erst ab 20 Mitarbeitern verpflichtend (§ 38 BDSG). Bei Nomad Solutions aktuell vermutlich nicht nötig. Bitte bestätigen.
3. **SLA-Ziel 99,5 % vs. 99,9 %** — aktuell 99,5 % in AGB § 7. Empfehlung: bei 99,5 % bleiben, bis Monitoring belastbar ist (Sentry + Vercel).
4. **AVV-Template** — wird Kunden auf Anfrage bereitgestellt. Muss noch geschrieben oder als PDF-Anhang angelegt werden.
5. **Email-Absender-Adresse** — Templates nutzen `kontakt@nomad-solutions.de`. Soll eine separate `noreply@` für Transaktions-Mails eingerichtet werden?
6. **Resend-Integration** — Paket ist nicht in `package.json`. Soll Lena hinzufügen oder macht Alex das im Rahmen Env-Vars?
7. **Logo für Email-Header** — aktuell nur Text „NomadWorks". Bei Wunsch: PNG hochladen, dann auf Vercel-CDN einbinden.

## 5. TypeScript

`npx tsc --noEmit` → **grün** (keine Ausgabe, exit 0).

## 6. Nicht angefasst (laut Spec)

- `app/globals.css`, `app/layout.tsx`, `components/ui/**`, `components/layout/**`
- `lib/actions/**`
- `proxy.ts`, `lib/services/stripe.ts`
- `next.config.ts`, `vercel.json`, `sentry.*.config.ts`
- Alle Modul-Pages strukturell

## 7. Geänderte/Neue Dateien

Geändert:
- `app/(legal)/impressum/page.tsx` (Berufshaftpflicht-Section)
- `app/(legal)/datenschutz/page.tsx` (Sentry + Cookie-Einwilligung)
- `components/shared/cookie-banner.tsx` (komplette Opt-in-Umstellung)

Neu:
- `emails/shared.ts`
- `emails/invitation.ts`
- `emails/trial-expiring.ts`
- `emails/payment-failed.ts`
- `emails/password-reset.ts`
- `emails/welcome.ts`
- `emails/index.ts`
- `docs/v3/phase-v3-7-stream-b-report.md` (dieses Dokument)
