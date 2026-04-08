"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"
import Link from "next/link"

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? match[2] : null
}

function setCookie(name: string, value: string, days: number) {
  const d = new Date()
  d.setTime(d.getTime() + days * 86400000)
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getCookie("nomadworks_consent")) {
      setVisible(true)
    }
  }, [])

  function handleAccept() {
    setCookie("nomadworks_consent", "true", 365)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg rounded-2xl bg-card shadow-lg border border-border p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Cookie className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">
              Wir verwenden technisch notwendige Cookies fuer die Anmeldung und Sitzungsverwaltung.
              Mehr in unserer{" "}
              <Link href="/datenschutz" className="text-primary underline">Datenschutzerklaerung</Link>.
            </p>
            <div className="mt-3">
              <Button
                onClick={handleAccept}
                className="rounded-xl font-semibold text-sm h-9 px-5"
              >
                Verstanden
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
