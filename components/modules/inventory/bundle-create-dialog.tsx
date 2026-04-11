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
import { Loader2, Plus } from "lucide-react"
import { createMaterialBundle } from "@/lib/actions/inventory"
import type { Bundle } from "@/lib/actions/inventory"

interface Props {
  onCreated: (bundle: Bundle) => void
}

export function BundleCreateDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createMaterialBundle(formData)
      if (result?.error) {
        if (typeof result.error === "string") {
          toast.error(result.error)
        } else {
          setFieldErrors(result.error)
        }
        return
      }
      if (result?.success && result.data) {
        toast.success("Bündel erfolgreich angelegt")
        onCreated(result.data)
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="rounded-xl font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Bündel anlegen
          </Button>
        }
      >
        {}
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Materialbündel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="bundle-name">Name *</Label>
            <Input
              id="bundle-name"
              name="name"
              placeholder="z.B. Bodenplatte Standard"
              className="h-11 rounded-xl"
              required
            />
            {fieldErrors.name && <p className="text-xs text-danger">{fieldErrors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bundle-desc">Beschreibung</Label>
            <Textarea
              id="bundle-desc"
              name="description"
              placeholder="Für welche Einsätze eignet sich dieses Bündel?"
              className="rounded-xl resize-none"
              rows={2}
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
            <Button type="submit" className="rounded-xl font-semibold" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Anlegen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
