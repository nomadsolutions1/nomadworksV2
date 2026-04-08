"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { Loader2 } from "lucide-react"
import { createRegieInvoice } from "@/lib/actions/invoices"
import { toast } from "sonner"

interface RegieInvoiceFormProps {
  sites: { id: string; name: string; status: string }[]
  customers: { id: string; name: string }[]
}

export function RegieInvoiceForm({
  sites,
  customers,
}: RegieInvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const activeSites = sites.filter((s) => s.status === "active")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createRegieInvoice(formData)
      if (result.error) {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Fehler beim Erstellen"
        )
        return
      }
      toast.success("Regierechnung erstellt")
      router.push("/rechnungen")
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Rechnungen", href: "/rechnungen" },
          { label: "Regierechnung" },
        ]}
      />
      <PageHeader
        title="Regierechnung erstellen"
        description="Rechnung aus Zeiterfassung und Materialverbrauch generieren"
      />

      <form onSubmit={handleSubmit}>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Abrechnungsdaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Baustelle *</Label>
              <Select name="site_id" required>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Baustelle wählen" />
                </SelectTrigger>
                <SelectContent>
                  {activeSites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Von *</Label>
                <Input
                  type="date"
                  name="date_from"
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bis *</Label>
                <Input
                  type="date"
                  name="date_to"
                  className="h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Kunde *</Label>
              <Select name="customer_id" required>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Kunde wählen" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Steuersatz (%)</Label>
              <Input
                type="number"
                name="tax_rate"
                defaultValue="19"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl font-semibold h-11 px-6"
                aria-label="Regierechnung generieren"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Rechnung generieren
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
