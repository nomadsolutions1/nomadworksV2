"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FOREMAN_MODULES } from "@/lib/utils/constants"
import { updateForemanPermissions, updateCanViewSensitiveData } from "@/lib/actions/employees"
import type { ForemanPermission } from "@/lib/actions/employees"
import { toast } from "sonner"
import { Shield, Eye, Pencil, Lock } from "lucide-react"

interface ForemanPermissionsProps {
  foremanId: string
  permissions: ForemanPermission[]
  canViewSensitiveData: boolean
}

export function ForemanPermissions({ foremanId, permissions, canViewSensitiveData: initialCanView }: ForemanPermissionsProps) {
  const [isPending, startTransition] = useTransition()

  const initialModules = FOREMAN_MODULES.map((mod) => {
    const perm = permissions.find((p) => p.module_name === mod.name)
    return { module_name: mod.name, label: mod.label, can_view: perm?.can_view ?? false, can_edit: perm?.can_edit ?? false }
  })

  const [modules, setModules] = useState(initialModules)
  const [canViewSensitive, setCanViewSensitive] = useState(initialCanView)

  function toggleView(moduleName: string) {
    setModules((prev) => prev.map((m) => m.module_name === moduleName ? { ...m, can_view: !m.can_view, can_edit: !m.can_view ? m.can_edit : false } : m))
  }

  function toggleEdit(moduleName: string) {
    setModules((prev) => prev.map((m) => m.module_name === moduleName ? { ...m, can_edit: !m.can_edit, can_view: !m.can_edit ? true : m.can_view } : m))
  }

  function handleSave() {
    startTransition(async () => {
      const permResult = await updateForemanPermissions(foremanId, modules.map((m) => ({ module_name: m.module_name, can_view: m.can_view, can_edit: m.can_edit })))
      const sensitiveResult = await updateCanViewSensitiveData(foremanId, canViewSensitive)
      if (permResult.error || sensitiveResult.error) {
        toast.error(permResult.error || sensitiveResult.error || "Fehler beim Speichern")
      } else {
        toast.success("Berechtigungen gespeichert")
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Modul-Berechtigungen
          </CardTitle>
          <p className="text-sm text-muted-foreground">Legen Sie fest, auf welche Module dieser Bauleiter zugreifen darf.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 pb-2 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground">Modul</span>
              <span className="text-xs font-medium text-muted-foreground text-center flex items-center justify-center gap-1"><Eye className="h-3 w-3" /> Ansehen</span>
              <span className="text-xs font-medium text-muted-foreground text-center flex items-center justify-center gap-1"><Pencil className="h-3 w-3" /> Bearbeiten</span>
            </div>
            {modules.map((mod) => (
              <div key={mod.module_name} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center rounded-xl px-3 py-2.5 hover:bg-muted/50">
                <span className="text-sm font-medium text-foreground">{mod.label}</span>
                <div className="flex justify-center">
                  <button type="button" role="switch" aria-checked={mod.can_view} aria-label={`${mod.label} Modul Ansehen aktivieren`} onClick={() => toggleView(mod.module_name)} className={`h-6 w-11 rounded-full transition-colors ${mod.can_view ? "bg-success" : "bg-muted"} relative`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${mod.can_view ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button type="button" role="switch" aria-checked={mod.can_edit} aria-label={`${mod.label} Modul Bearbeiten aktivieren`} onClick={() => toggleEdit(mod.module_name)} className={`h-6 w-11 rounded-full transition-colors ${mod.can_edit ? "bg-primary" : "bg-muted"} relative`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${mod.can_edit ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Sensible Personaldaten
          </CardTitle>
          <p className="text-sm text-muted-foreground">Gehalt, Steuerdaten, Bankverbindung und Sozialversicherungsnummer.</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-muted/50">
            <div>
              <p className="text-sm font-medium text-foreground">Zugriff auf sensible Personaldaten</p>
              <p className="text-xs text-muted-foreground">IBAN, Gehalt, Steuerklasse, SV-Nummer, Krankenversicherung</p>
            </div>
            <button type="button" role="switch" aria-checked={canViewSensitive} aria-label="Zugriff auf sensible Personaldaten aktivieren" onClick={() => setCanViewSensitive(!canViewSensitive)} className={`h-6 w-11 rounded-full transition-colors ${canViewSensitive ? "bg-warning" : "bg-muted"} relative flex-shrink-0`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${canViewSensitive ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} className="rounded-xl font-semibold">
          {isPending ? "Speichern..." : "Berechtigungen speichern"}
        </Button>
      </div>
    </div>
  )
}
