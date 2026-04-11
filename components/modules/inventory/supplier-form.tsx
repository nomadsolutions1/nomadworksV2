"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Star } from "lucide-react"
import { createSupplier, updateSupplier } from "@/lib/actions/inventory"
import type { Supplier } from "@/lib/actions/inventory"

interface SupplierFormProps {
  supplier?: Supplier
  mode: "create" | "edit"
}

export function SupplierForm({ supplier, mode }: SupplierFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(supplier?.rating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    if (rating > 0) formData.set("rating", rating.toString())

    startTransition(async () => {
      const action =
        mode === "create" ? createSupplier : (fd: FormData) => updateSupplier(supplier!.id, fd)
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
          mode === "create"
            ? "Lieferant erfolgreich angelegt"
            : "Lieferant erfolgreich aktualisiert"
        )
        if (mode === "create") router.push("/lager/lieferanten")
        else router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Lieferantendaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Firmenname *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={supplier?.name ?? ""}
              placeholder="z.B. Baustoffhandel Müller GmbH"
              className="h-11 rounded-xl"
              required
            />
            {fieldErrors.name && (
              <p className="text-xs text-danger">{fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact_person">Ansprechpartner</Label>
              <Input
                id="contact_person"
                name="contact_person"
                defaultValue={supplier?.contact_person ?? ""}
                placeholder="Max Mustermann"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={supplier?.phone ?? ""}
                placeholder="+49 89 12345678"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={supplier?.email ?? ""}
                placeholder="info@lieferant.de"
                className="h-11 rounded-xl"
              />
              {fieldErrors.email && (
                <p className="text-xs text-danger">{fieldErrors.email[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                defaultValue={supplier?.address ?? ""}
                placeholder="Straße, PLZ Ort"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Bewertung & Notizen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Bewertung</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? 0 : star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-0.5 rounded transition-transform hover:scale-110"
                  aria-label={`${star} Sterne`}
                >
                  <Star
                    className={`h-7 w-7 ${
                      (hovered || rating) >= star
                        ? "fill-warning text-warning"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">{rating} / 5 Sterne</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={supplier?.notes ?? ""}
              placeholder="Zahlungskonditionen, Lieferzeiten, besondere Vereinbarungen..."
              className="rounded-xl resize-none"
              rows={3}
            />
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
          {mode === "create" ? "Lieferant anlegen" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  )
}
