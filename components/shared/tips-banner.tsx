"use client"

import { useState } from "react"
import { X, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

const MODULE_TIPS: Record<string, string> = {
  mitarbeiter:
    "Tipp: Legen Sie zuerst alle Mitarbeiter an und vergeben Sie Rollen. Bauleiter erhalten dann gezielt Modul-Berechtigungen.",
  auftraege:
    "Tipp: Erstellen Sie Auftraege und verknuepfen Sie Kunden und Baustellen. Das Budget wird automatisch auf Baustellen verteilt.",
  baustellen:
    "Tipp: Weisen Sie jeder Baustelle einen Bauleiter zu. Kosten werden automatisch aus Zeiterfassung, Material und Geraeten berechnet.",
  disposition:
    "Tipp: Planen Sie die Woche im Voraus. Weisen Sie Mitarbeiter per Drag & Drop zu und nutzen Sie die Bulk-Funktion fuer wiederkehrende Einsaetze.",
  zeiterfassung:
    "Tipp: Mitarbeiter stempeln per App ein und aus. GPS-Koordinaten werden automatisch erfasst. Manager koennen Eintraege nachtraeglich korrigieren.",
  bautagesbericht:
    "Tipp: Erfassen Sie taeglich Wetter, Arbeiten und Vorkommnisse. Fotos und Dokumente koennen direkt angehaengt werden. Der Bautagesbericht ist ein rechtlich wichtiges Dokument.",
}

interface TipsBannerProps {
  module: string
}

export function TipsBanner({ module }: TipsBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const tip = MODULE_TIPS[module]

  if (!tip || dismissed) return null

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-6">
      <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-foreground flex-1">{tip}</p>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
