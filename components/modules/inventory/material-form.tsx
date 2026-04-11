"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createMaterial, updateMaterial } from "@/lib/actions/inventory"
import { MATERIAL_CATEGORIES } from "@/lib/utils/constants"
import type { Material, Supplier } from "@/lib/actions/inventory"

interface MaterialFormProps {
  material?: Material
  suppliers: Supplier[]
  mode: "create" | "edit"
}

// DB CHECK: unit IN ('kg','m','m2','m3','l','pack','piece','Stk','t','Rolle','Paar','Set','Sack','Palette','Eimer')
const UNIT_OPTIONS = [
  { value: "piece", label: "Stück" },
  { value: "Stk", label: "Stk" },
  { value: "m", label: "Meter (m)" },
  { value: "m2", label: "m²" },
  { value: "m3", label: "m³" },
  { value: "kg", label: "Kilogramm (kg)" },
  { value: "t", label: "Tonne (t)" },
  { value: "l", label: "Liter (l)" },
  { value: "pack", label: "Packung" },
  { value: "Sack", label: "Sack" },
  { value: "Palette", label: "Palette" },
  { value: "Rolle", label: "Rolle" },
  { value: "Paar", label: "Paar" },
  { value: "Set", label: "Set" },
  { value: "Eimer", label: "Eimer" },
]

export function MaterialForm({ material, suppliers, mode }: MaterialFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [category, setCategory] = useState(material?.category ?? "")
  const [supplierId, setSupplierId] = useState(material?.supplier_id ?? "")
  const [unit, setUnit] = useState(material?.unit ?? "")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    formData.set("category", category)
    formData.set("unit", unit)
    formData.set("supplier_id", supplierId)

    startTransition(async () => {
      const action = mode === "create" ? createMaterial : (fd: FormData) => updateMaterial(material!.id, fd)
      const result = await action(formData)

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
        toast.success(
          mode === "create" ? "Material erfolgreich angelegt" : "Material erfolgreich aktualisiert"
        )
        if (mode === "create") router.push("/lager")
        else router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Materialinformationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Bezeichnung *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={material?.name ?? ""}
                placeholder="z.B. Zement 50kg"
                className="h-11 rounded-xl"
                required
              />
              {fieldErrors.name && (
                <p className="text-xs text-danger">{fieldErrors.name[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="article_number">Artikelnummer</Label>
              <Input
                id="article_number"
                name="article_number"
                defaultValue={material?.article_number ?? ""}
                placeholder="z.B. ZEM-50-CEM"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Kategorie *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Kategorie wählen">
                    {(value) => (value as string) || "Kategorie wählen"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.category && (
                <p className="text-xs text-danger">{fieldErrors.category[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Einheit *</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Einheit wählen">
                    {(value) =>
                      UNIT_OPTIONS.find((u) => u.value === value)?.label ?? "Einheit wählen"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.unit && (
                <p className="text-xs text-danger">{fieldErrors.unit[0]}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Bestand & Preis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {mode === "create" && (
              <div className="space-y-1.5">
                <Label htmlFor="current_stock">Anfangsbestand</Label>
                <Input
                  id="current_stock"
                  name="current_stock"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue="0"
                  className="h-11 rounded-xl"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="min_stock">Mindestbestand</Label>
              <Input
                id="min_stock"
                name="min_stock"
                type="number"
                step="0.01"
                min={0}
                defaultValue={material?.min_stock?.toString() ?? ""}
                placeholder="z.B. 50"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price_per_unit">Preis / Einheit (€)</Label>
              <Input
                id="price_per_unit"
                name="price_per_unit"
                type="number"
                step="0.01"
                min={0}
                defaultValue={material?.price_per_unit?.toString() ?? ""}
                placeholder="z.B. 8,50"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Lieferant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Lieferant (optional)</Label>
            <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Lieferant auswählen">
                  {(value) => {
                    if (!value) return "Lieferant auswählen"
                    return suppliers.find((s) => s.id === value)?.name ?? "Lieferant auswählen"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Kein Lieferant</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Abbrechen
        </Button>
        <Button type="submit" className="rounded-xl font-semibold" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {mode === "create" ? "Material anlegen" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  )
}
