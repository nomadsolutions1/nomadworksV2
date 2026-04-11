/**
 * NOTE (James Park, G6 — 2026-04-10):
 * Die aktive Sentry-Client-Initialisierung ist nach `instrumentation-client.ts`
 * gewandert und dort an den DSGVO-Cookie-Consent (`nomadworks_consent_v2`)
 * gekoppelt. Sentry lädt nur noch bei expliziter User-Einwilligung.
 *
 * Diese Datei bleibt absichtlich leer, weil der `@sentry/nextjs`-Build-Plugin
 * sie standardmäßig erwartet. Sie wird nicht mehr importiert und hat keine
 * Seiteneffekte.
 */
export {};
