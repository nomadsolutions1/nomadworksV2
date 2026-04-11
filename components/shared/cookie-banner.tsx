"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"
import Link from "next/link"

/**
 * DSGVO-konformer Cookie-Banner mit Opt-in.
 *
 * Kategorien:
 * - Notwendig: immer aktiv (Supabase Auth Session, Spracheinstellung)
 * - Analyse: Sentry Error Tracking — standardmäßig AUS, Opt-in erforderlich
 * - Marketing: aktuell nicht in Verwendung — aus Gründen der Transparenz aufgeführt
 *
 * Speicherung: localStorage unter "nomadworks_consent_v2" als JSON.
 */

const STORAGE_KEY = "nomadworks_consent_v2"

type Consent = {
  necessary: true
  analytics: boolean
  marketing: boolean
  timestamp: string
}

function loadConsent(): Consent | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Consent
  } catch {
    return null
  }
}

function saveConsent(c: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
  } catch {
    // Speicher blockiert — Banner wird bei nächstem Besuch erneut angezeigt.
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    if (!loadConsent()) {
      setVisible(true)
    }
  }, [])

  function persist(next: Consent) {
    saveConsent(next)
    setVisible(false)
    setShowSettings(false)
  }

  function handleAcceptAll() {
    persist({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    })
  }

  function handleOnlyNecessary() {
    persist({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    })
  }

  function handleSaveSettings() {
    persist({
      necessary: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    })
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center p-4 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-xl rounded-2xl bg-card shadow-lg border border-border p-5"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-desc"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Cookie className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1">
            <h2 id="cookie-banner-title" className="text-base font-semibold text-foreground">
              Cookies und Datenschutz
            </h2>

            {!showSettings ? (
              <>
                <p id="cookie-banner-desc" className="mt-2 text-sm text-foreground leading-relaxed">
                  Wir verwenden notwendige Cookies für die Anmeldung. Optional dürfen wir mit Ihrer
                  Zustimmung technische Fehler (Sentry) erfassen, damit wir Probleme schneller beheben.
                  Keine Werbung, kein Tracking.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Mehr in der{" "}
                  <Link href="/datenschutz" className="text-primary underline">
                    Datenschutzerklärung
                  </Link>{" "}
                  und im{" "}
                  <Link href="/impressum" className="text-primary underline">
                    Impressum
                  </Link>
                  .
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleAcceptAll}
                    className="rounded-xl font-semibold text-sm h-9 px-5"
                  >
                    Alle akzeptieren
                  </Button>
                  <Button
                    onClick={handleOnlyNecessary}
                    variant="outline"
                    className="rounded-xl font-semibold text-sm h-9 px-5"
                  >
                    Nur notwendige
                  </Button>
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="ghost"
                    className="rounded-xl font-semibold text-sm h-9 px-5"
                  >
                    Einstellungen
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p id="cookie-banner-desc" className="mt-2 text-sm text-foreground leading-relaxed">
                  Wählen Sie, welche Cookies Sie erlauben möchten. Ihre Auswahl können Sie jederzeit
                  ändern.
                </p>

                <div className="mt-4 space-y-3">
                  <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 cursor-not-allowed opacity-80">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="mt-0.5"
                      aria-label="Notwendige Cookies (immer aktiv)"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-semibold text-foreground">Notwendig (immer aktiv)</div>
                      <div className="text-xs text-muted-foreground">
                        Anmeldung und Sitzungsverwaltung. Ohne diese Cookies können Sie sich nicht
                        anmelden.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="mt-0.5"
                      aria-label="Analyse und Fehlerprotokollierung"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-semibold text-foreground">Fehlerprotokollierung (Sentry)</div>
                      <div className="text-xs text-muted-foreground">
                        Meldet technische Fehler an Sentry (USA, mit EU-Standardvertragsklauseln), damit
                        wir Probleme schneller beheben. Keine persönlichen Daten.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                      className="mt-0.5"
                      aria-label="Marketing"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-semibold text-foreground">Marketing</div>
                      <div className="text-xs text-muted-foreground">
                        Aktuell nicht in Verwendung. NomadWorks nutzt keine Werbe-Cookies.
                      </div>
                    </div>
                  </label>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleSaveSettings}
                    className="rounded-xl font-semibold text-sm h-9 px-5"
                  >
                    Auswahl speichern
                  </Button>
                  <Button
                    onClick={() => setShowSettings(false)}
                    variant="ghost"
                    className="rounded-xl font-semibold text-sm h-9 px-5"
                  >
                    Zurück
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
