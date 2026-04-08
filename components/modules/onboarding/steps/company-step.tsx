"use client"

import { useTransition } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { AddressFields } from "@/components/shared/address-fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { updateOnboardingCompanyData } from "@/lib/actions/onboarding"
import { toast } from "sonner"

interface CompanyStepProps {
  companyName: string
  address: string | null
  taxId: string | null
  tradeLicense: string | null
  onNext: () => void
  onSkip: () => void
}

const EMPLOYEE_RANGES = ["1-5", "6-10", "11-30", "31-100"]
const REVENUE_RANGES = ["unter 500.000€", "500.000€ - 1 Mio€", "1 Mio€ - 5 Mio€", "über 5 Mio€"]
const TRADES = ["Rohbau", "Ausbau", "Tiefbau", "Hochbau", "Sanierung", "Elektro", "Sanitär", "Dachdeckung", "Sonstiges"]

export function CompanyStep({ companyName, address, taxId, tradeLicense, onNext, onSkip }: CompanyStepProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateOnboardingCompanyData(formData)
      if (result.error && typeof result.error === "string") {
        toast.error(result.error)
        return
      }
      onNext()
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-xl mx-auto space-y-6"
    >
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-semibold text-foreground">Erzählen Sie uns von Ihrer Firma</h2>
        <p className="text-sm text-muted-foreground">Diese Daten können Sie jederzeit unter Firma ändern.</p>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Firmenname *</Label>
              <Input id="name" name="name" defaultValue={companyName} required className="h-11 rounded-xl" />
            </div>

            <AddressFields address={address} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tax_id">Steuernummer</Label>
                <Input id="tax_id" name="tax_id" defaultValue={taxId ?? ""} placeholder="Für Ihre Rechnungen" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trade_license">Gewerbeschein</Label>
                <Input id="trade_license" name="trade_license" defaultValue={tradeLicense ?? ""} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Anzahl Mitarbeiter *</Label>
                <Select name="employee_count_range" required>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_RANGES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Geschätzter Jahresumsatz</Label>
                <Select name="revenue_range">
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVENUE_RANGES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Gewerke</Label>
              <div className="flex flex-wrap gap-2">
                {TRADES.map((trade) => (
                  <label key={trade} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary/30">
                    <input type="checkbox" name="trades" value={trade} className="sr-only" />
                    {trade}
                  </label>
                ))}
              </div>
              <input type="hidden" name="trades" value="" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={onSkip} className="text-sm text-muted-foreground/70 hover:text-muted-foreground">
                Später vervollständigen
              </button>
              <Button type="submit" disabled={isPending} className="rounded-xl bg-primary hover:bg-primary/80 font-semibold px-8 h-11">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Weiter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
