"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Loader2, Plus } from "lucide-react"
import { addBundleItem } from "@/lib/actions/inventory"
import type { Material } from "@/lib/actions/inventory"

interface Props {
  bundleId: string
  materials: Material[]
}

export function BundleItemDialog({ bundleId, materials }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [materialId, setMaterialId] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("material_id", materialId)

    startTransition(async () => {
      const result = await addBundleItem(bundleId, formData)
      if (result?.error) {
        toast.error(typeof result.error === "string" ? result.error : "Eingabe ungültig")
        return
      }
      if (result?.success) {
        toast.success("Material zum Bündel hinzugefügt")
        setOpen(false)
        setMaterialId("")
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Material
          </Button>
        }
      >
        {}
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>Material hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-qty">Menge *</Label>
            <Input
              id="add-qty"
              name="quantity"
              type="number"
              step="0.01"
              min={0.01}
              placeholder="z.B. 10"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
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
              Hinzufügen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
