"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface BautagesberichtFiltersProps {
  sites: { id: string; name: string }[]
}

export function BautagesberichtFilters({ sites }: BautagesberichtFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSite = searchParams.get("site") || ""
  const currentFrom = searchParams.get("from") || ""
  const currentTo = searchParams.get("to") || ""
  const hasFilters = currentSite || currentFrom || currentTo

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      router.push(`/bautagesbericht?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={currentSite || "all"}
        onValueChange={(v) => updateParams({ site: v === "all" ? "" : (v ?? "") })}
      >
        <SelectTrigger className="h-9 rounded-xl w-[200px] text-sm">
          <SelectValue placeholder="Alle Baustellen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Baustellen</SelectItem>
          {sites.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={currentFrom}
        onChange={(e) => updateParams({ from: e.target.value })}
        className="h-9 rounded-xl w-[160px] text-sm"
        title="Von Datum"
      />
      <Input
        type="date"
        value={currentTo}
        onChange={(e) => updateParams({ to: e.target.value })}
        className="h-9 rounded-xl w-[160px] text-sm"
        title="Bis Datum"
      />
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/bautagesbericht")}
        >
          <X className="h-3.5 w-3.5" />
          Filter zurücksetzen
        </Button>
      )}
    </div>
  )
}
