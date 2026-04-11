"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowDownToLine, ArrowUpFromLine, RotateCcw } from "lucide-react"
import { createStockMovement } from "@/lib/actions/inventory"
import type { Material } from "@/lib/actions/inventory"

interface MovementDialogProps {
  materials: Material[]
  sites?: { id: string; name: string }[]
  defaultMaterialId?: string
  trigger: React.ReactElement
  onSuccess?: () => void
}

type MovementType = "in" | "out" | "return"

const TYPE_CONFIG: Record<MovementType, { label: string; icon: typeof ArrowDownToLine }> = {
  in: { label: "Eingang", icon: ArrowDownToLine },
  out: { label: "Ausgang", icon: ArrowUpFromLine },
  return: { label: "Rückgabe", icon: RotateCcw },
}

export function MovementDialog({
  materials,
  sites = [],
  defaultMaterialId,
  trigger,
  onSuccess,
}: MovementDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<MovementType>("in")
  const [materialId, setMaterialId] = useState(defaultMaterialId ?? "")
  const [siteId, setSiteId] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    formData.set("type", type)
    formData.set("material_id", materialId)
    if (siteId) formData.set("site_id", siteId)

    startTransition(async () => {
      const result = await createStockMovement(formData)
      if (result?.error) {
        if (typeof result.error === "string") {
          toast.error(result.error)
        } else {
          setFieldErrors(result.error)
          toast.error("Bitte prüfen Sie Ihre Eingaben")
        }
        return
      }
      if (result?.success) {
        const labels: Record<MovementType, string> = {
          in: "Wareneingang",
          out: "Warenausgang",
          return: "Rückgabe",
        }
        toast.success(`${labels[type]} erfolgreich gebucht`)
        setOpen(false)
        setMaterialId(defaultMaterialId ?? "")
        setSiteId("")
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger}>{}</DialogTrigger>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>Lagerbewegung buchen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label>Bewegungstyp</Label>
            <Tabs value={type} onValueChange={(v) => setType((v as MovementType) ?? "in")}>
              <TabsList className="w-full grid grid-cols-3 h-11 rounded-xl">
                {(Object.entries(TYPE_CONFIG) as [MovementType, (typeof TYPE_CONFIG)[MovementType]][]).map(
                  ([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="rounded-lg flex items-center gap-1.5"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </TabsTrigger>
                    )
                  }
                )}
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <Label>Material *</Label>
            <Select value={materialId} onValueChange={(v) => setMaterialId(v ?? "")}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Material wählen">
                  {(value) => materials.find((m) => m.id === value)?.name ?? "Material wählen"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                    {m.current_stock !== null && (
                      <span className="text-muted-foreground ml-2">
                        (Bestand: {m.current_stock} {m.unit})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.material_id && (
              <p className="text-xs text-danger">{fieldErrors.material_id[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mov-quantity">Menge *</Label>
            <Input
              id="mov-quantity"
              name="quantity"
              type="number"
              step="0.01"
              min={0.01}
              placeholder="0"
              className="h-11 rounded-xl"
              required
            />
            {fieldErrors.quantity && (
              <p className="text-xs text-danger">{fieldErrors.quantity[0]}</p>
            )}
          </div>

          {sites.length > 0 && (
            <div className="space-y-1.5">
              <Label>
                Baustelle {type === "out" && <span className="text-danger">*</span>}
              </Label>
              <Select value={siteId} onValueChange={(v) => setSiteId(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Baustelle wählen">
                    {(value) => sites.find((s) => s.id === value)?.name ?? "Baustelle wählen"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {type === "out" && (
                <p className="text-xs text-muted-foreground">
                  Bei Entnahmen muss eine Baustelle angegeben werden.
                </p>
              )}
              {fieldErrors.site_id && (
                <p className="text-xs text-danger">{fieldErrors.site_id[0]}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="mov-notes">Notizen</Label>
            <Textarea
              id="mov-notes"
              name="notes"
              placeholder="z.B. Lieferschein XYZ..."
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="rounded-xl font-semibold"
              disabled={isPending || !materialId}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Buchen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
