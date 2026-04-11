"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { RatingInput } from "@/components/modules/subcontractors/rating-display"
import {
  createSubcontractor,
  updateSubcontractor,
} from "@/lib/actions/subcontractors"
import type { Subcontractor } from "@/lib/actions/subcontractors"

interface SubcontractorFormProps {
  subcontractor?: Subcontractor
  mode: "create" | "edit"
}

export function SubcontractorForm({ subcontractor, mode }: SubcontractorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [reverseCharge, setReverseCharge] = useState<boolean>(
    subcontractor?.reverse_charge_13b ?? false
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    formData.set("reverse_charge_13b", reverseCharge ? "true" : "")

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createSubcontractor(formData)
          : await updateSubcontractor(subcontractor!.id, formData)

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
            ? "Subunternehmer erfolgreich angelegt"
            : "Änderungen gespeichert"
        )
        if (mode === "create" && "id" in result && result.id) {
          router.push(`/subunternehmer/${result.id}`)
        } else {
          router.refresh()
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Firmendaten */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Firmendaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Firmenname *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={subcontractor?.name ?? ""}
              placeholder="z.B. Elektro Meyer GmbH"
              className="h-11 rounded-xl"
              required
            />
            {fieldErrors.name && (
              <p className="text-xs text-danger">{fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="trade">Gewerk</Label>
              <Input
                id="trade"
                name="trade"
                defaultValue={subcontractor?.trade ?? ""}
                placeholder="z.B. Elektroinstallation"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                defaultValue={subcontractor?.address ?? ""}
                placeholder="Straße, PLZ Ort"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kontakt */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact_person">Ansprechpartner</Label>
              <Input
                id="contact_person"
                name="contact_person"
                defaultValue={subcontractor?.contact_person ?? ""}
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
                defaultValue={subcontractor?.phone ?? ""}
                placeholder="+49 123 456789"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={subcontractor?.email ?? ""}
              placeholder="info@beispiel.de"
              className="h-11 rounded-xl"
            />
            {fieldErrors.email && (
              <p className="text-xs text-danger">{fieldErrors.email[0]}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* §48b + §13b */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            §48b Freistellungsbescheinigung &amp; §13b Reverse Charge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="tax_exemption_valid_until">§48b gültig bis</Label>
            <Input
              id="tax_exemption_valid_until"
              name="tax_exemption_valid_until"
              type="date"
              defaultValue={subcontractor?.tax_exemption_valid_until ?? ""}
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Die §48b-Freistellungsbescheinigung befreit vom Bauabzugssteuer-Einbehalt (15%).
              Ohne gültige Bescheinigung muss der Auftraggeber die Steuer einbehalten. Warnung 30
              Tage vor Ablauf.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reverse_charge_13b"
                checked={reverseCharge}
                onChange={(e) => setReverseCharge(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="reverse_charge_13b" className="text-sm font-medium cursor-pointer">
                §13b Steuerschuldnerschaft (Reverse Charge)
              </Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reverse_charge_certificate_valid_until">
                §13b Nachweis gültig bis
              </Label>
              <Input
                id="reverse_charge_certificate_valid_until"
                name="reverse_charge_certificate_valid_until"
                type="date"
                defaultValue={subcontractor?.reverse_charge_certificate_valid_until ?? ""}
                className="h-11 rounded-xl"
                disabled={!reverseCharge}
              />
              <p className="text-xs text-muted-foreground">
                Bei §13b UStG schuldet der Auftraggeber die Umsatzsteuer. Der Subunternehmer stellt
                Rechnungen ohne MwSt aus.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bewertung */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Bewertung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Qualität</Label>
            <RatingInput name="quality_rating" defaultValue={subcontractor?.quality_rating} />
          </div>
          <div className="space-y-1.5">
            <Label>Zuverlässigkeit</Label>
            <RatingInput
              name="reliability_rating"
              defaultValue={subcontractor?.reliability_rating}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Preis-Leistung</Label>
            <RatingInput name="price_rating" defaultValue={subcontractor?.price_rating} />
          </div>
        </CardContent>
      </Card>

      {/* Notizen */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={subcontractor?.notes ?? ""}
            placeholder="Interne Notizen zum Subunternehmer..."
            rows={4}
            className="rounded-xl resize-none"
          />
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
          {mode === "create" ? "Subunternehmer anlegen" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  )
}
