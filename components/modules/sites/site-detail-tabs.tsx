"use client"

import { useRouter, usePathname } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { ReactNode } from "react"

interface TabSlots {
  uebersicht: ReactNode
  kosten: ReactNode
  nachkalkulation: ReactNode
  aufmass: ReactNode
  zeiterfassung: ReactNode
  team: ReactNode
  bautagesbericht: ReactNode
  fuhrpark: ReactNode
  material: ReactNode
  bearbeiten: ReactNode
}

interface SiteDetailTabsProps {
  activeTab: string
  children: TabSlots
}

const TAB_LABELS: Record<string, string> = {
  uebersicht: "Übersicht",
  kosten: "Kosten",
  nachkalkulation: "Nachkalkulation",
  aufmass: "Aufmaß",
  zeiterfassung: "Zeiterfassung",
  team: "Team",
  bautagesbericht: "Bautagesbericht",
  fuhrpark: "Fuhrpark",
  material: "Material",
  bearbeiten: "Bearbeiten",
}

export function SiteDetailTabs({ activeTab, children }: SiteDetailTabsProps) {
  const router = useRouter()
  const pathname = usePathname()

  function handleTabChange(value: string) {
    const params = new URLSearchParams()
    if (value !== "uebersicht") params.set("tab", value)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const validTab = Object.keys(TAB_LABELS).includes(activeTab) ? activeTab : "uebersicht"

  return (
    <Tabs value={validTab} onValueChange={handleTabChange}>
      <TabsList className="rounded-xl bg-muted h-auto p-1 flex-wrap gap-1">
        {Object.entries(TAB_LABELS).map(([value, label]) => (
          <TabsTrigger key={value} value={value} className="rounded-lg px-4 py-2 text-sm font-medium">{label}</TabsTrigger>
        ))}
      </TabsList>
      {Object.entries(children).map(([key, content]) => (
        <TabsContent key={key} value={key} className="mt-6">{content}</TabsContent>
      ))}
    </Tabs>
  )
}
