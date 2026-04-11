"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center rounded-xl bg-primary text-white px-6 py-2.5 text-sm font-semibold hover:bg-primary/80"
    >
      <Printer className="h-4 w-4 mr-2" /> Drucken / Als PDF speichern
    </button>
  )
}
