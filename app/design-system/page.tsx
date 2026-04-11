import type { Metadata } from "next"
import { DesignSystemClient } from "./client"

export const metadata: Metadata = {
  title: "Design System — NomadWorks v3",
  description: "Live Style Guide: Baustelle Modern",
}

/**
 * Öffentliche Referenz-Seite (kein Login) für die v3-Design-Tokens.
 * Mikail öffnet diese auf der Vercel-Preview unter /design-system
 * und sieht Farben, Typo, Spacing, Shadows, Buttons, Cards, Forms etc.
 * inkl. Dark Mode Toggle.
 */
export default function DesignSystemPage() {
  return <DesignSystemClient />
}
