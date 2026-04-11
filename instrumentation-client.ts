import * as Sentry from "@sentry/nextjs";

/**
 * DSGVO-konforme Sentry-Initialisierung (James Park, G6):
 *
 * Sentry (USA) darf erst nach expliziter User-Einwilligung laden.
 * Wir lesen den Consent aus localStorage (`nomadworks_consent_v2`),
 * den der CookieBanner schreibt. Solange kein Consent vorhanden ist
 * oder `analytics !== true`, wird Sentry NICHT initialisiert —
 * keine Requests, keine Cookies, keine Client-ID.
 *
 * Hinweis: Opt-in nachträglich → User muss einmal die Seite neu
 * laden, damit Sentry aktiv wird. Kein Runtime-Reinit-Hack.
 *
 * Fallback: bei jedem Fehler im Lese-Pfad → kein Sentry-Load
 * (fail-closed statt fail-open).
 */

const STORAGE_KEY = "nomadworks_consent_v2";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Consent;
    return parsed?.analytics === true;
  } catch {
    return false;
  }
}

if (hasAnalyticsConsent()) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],
    enabled: process.env.NODE_ENV === "production",
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
