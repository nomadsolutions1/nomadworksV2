# NomadWorks v3 — Ops Runbook

Einseitige Betriebs-Anleitung für Production. Stand: 2026-04-10.

## 1. Deploy-Flow (CLI-basiert, solange Git-Integration getrennt)

```bash
# Preview-Deploy (nicht Prod)
vercel deploy --yes

# Production-Deploy
vercel deploy --prod --yes
```

Repo muss verlinkt sein (`.vercel/project.json` vorhanden). Immer vom Repo-Root aus ausfuehren.

## 2. Git-Integration reconnecten (Dashboard)

Derzeit ist die GitHub-Verbindung getrennt. Reconnect-Pfad:

1. https://vercel.com/nomad-solutions/nomadworks-v2/settings/git
2. Section "Connected Git Repository" -> **Disconnect**
3. **Connect Git Repository** -> Provider: GitHub
4. Repo auswaehlen: `nomadsolutions1/nomadworksV2`
5. Production-Branch auf `main` setzen
6. Save. Ab jetzt triggern Pushes auf `main` wieder Auto-Deploys.

## 3. Rollback bei kaputtem Deploy (30 Sekunden)

```bash
# Option A: CLI
vercel rollback <deployment-url>

# Option B: Dashboard
# https://vercel.com/nomad-solutions/nomadworks-v2/deployments
# -> alten gruenen Deploy waehlen -> "..." -> "Promote to Production"
```

## 4. Env-Var aendern / hinzufuegen

```bash
# Aendern (rm + add)
vercel env rm KEY production --yes
vercel env add KEY production   # Wert interaktiv eingeben

# Neu hinzufuegen
vercel env add KEY production

# Werte lokal runterziehen
vercel env pull .env.local --environment=production --yes
```

**Nach Env-Aenderung immer Redeploy:** `vercel deploy --prod --yes`

## 5. Logs anschauen

```bash
# Runtime-Logs letzter Deploy
vercel logs <deployment-url>

# Build-Logs
# Dashboard: https://vercel.com/nomad-solutions/nomadworks-v2/deployments
# -> Deploy anklicken -> Build Logs Tab
```

## 6. Sentry-Issues

- Dashboard: https://nomad-solutions-ug.sentry.io/issues/
- Org: `nomad-solutions-ug`, Project: in Env-Var `SENTRY_PROJECT`
- Alerts konfigurieren: Sentry Dashboard -> Alerts -> Create Alert Rule
- Source-Maps-Upload laeuft im Build wenn `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` gesetzt sind (alle drei in Prod vorhanden)

## 7. Supabase-Backups

- Automatisch: Dashboard -> Project -> Database -> Backups (PITR, taeglich)
- Eigener Cron: `/api/cron/backup` protokolliert taeglich Tabellen-Counts (Schedule `0 3 * * *` UTC)
- Auth via `CRON_SECRET` Header (`Authorization: Bearer $CRON_SECRET`)

## 8. Cron Health-Check

```bash
# Letzte Cron-Runs in den Runtime-Logs suchen
vercel logs <prod-deployment-url> --since 24h | grep cron/backup
```

Oder Dashboard -> Project -> Logs -> Filter `url:/api/cron/backup`.

## 9. Custom-Domain-Setup (fuer Launch)

Aktueller Fallback: `nomadworks-v2.vercel.app`.

Ziel-Domain z.B. `app.nomad-solutions.de`:

1. Vercel: Project -> Settings -> Domains -> **Add Domain** `app.nomad-solutions.de`
2. Vercel zeigt benoetigte DNS-Records an. Beim Domain-Provider eintragen:
   - **CNAME**: `app` -> `cname.vercel-dns.com.` (fuer Subdomain)
   - **A-Record**: `@` -> `76.76.21.21` (nur wenn Apex/Root-Domain gewuenscht)
3. Warten bis DNS propagiert (meist <10 min, max 48h). Vercel issued SSL automatisch via Let's Encrypt.
4. Env-Var `NEXT_PUBLIC_APP_URL` auf neue Domain aktualisieren (siehe Schritt 4).
5. Stripe-Webhook-Endpoint in Stripe-Dashboard auf neue Domain updaten.
6. Redeploy Production.

## 10. Monitoring-Checklist vor Launch

- [ ] Sentry empfaengt Events (Test-Error in Prod werfen)
- [ ] Stripe-Webhook in Stripe-Dashboard auf `<domain>/api/webhooks/stripe` registriert, `STRIPE_WEBHOOK_SECRET` matcht
- [ ] Alle Production-Env-Vars gesetzt (`vercel env ls production`)
- [ ] Cron `/api/cron/backup` lief mindestens einmal erfolgreich
- [ ] Vercel Analytics: optional, DSGVO-Consent-Banner noetig falls aktiv
- [ ] Supabase PITR-Backups aktiv (Dashboard -> Database -> Backups)
- [ ] Custom Domain gesetzt + SSL gruen
- [ ] Security Headers pruefen: https://securityheaders.com/?q=<domain>
