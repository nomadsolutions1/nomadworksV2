"use client"

import { useTransition } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { updateOnboardingInvoiceSettings } from "@/lib/actions/onboarding"
import { toast } from "sonner"

interface InvoiceStepProps {
  bankName: string | null
  bankIban: string | null
  bankBic: string | null
  invoicePrefix: string | null
  taxRate: number | null
  paymentDays: number | null
  onNext: () => void
  onSkip: () => void
}

export function InvoiceStep({ bankName, bankIban, bankBic, invoicePrefix, taxRate, paymentDays, onNext, onSkip }: InvoiceStepProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateOnboardingInvoiceSettings(formData)
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
        <h2 className="text-2xl font-semibold text-foreground">Rechnungseinstellungen</h2>
        <p className="text-sm text-muted-foreground">Damit Sie direkt Rechnungen schreiben können</p>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank_name">Bank</Label>
              <Input id="bank_name" name="bank_name" defaultValue={bankName ?? ""} placeholder="z.B. Sparkasse Duisburg" className="h-11 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bank_iban">IBAN</Label>
                <Input id="bank_iban" name="bank_iban" defaultValue={bankIban ?? ""} placeholder="DE..." className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank_bic">BIC</Label>
                <Input id="bank_bic" name="bank_bic" defaultValue={bankBic ?? ""} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="invoice_prefix">Rechnungspräfix *</Label>
                <Input id="invoice_prefix" name="invoice_prefix" defaultValue={invoicePrefix ?? "RE"} required className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="default_tax_rate">Steuersatz % *</Label>
                <Input id="default_tax_rate" name="default_tax_rate" type="number" step="0.1" defaultValue={taxRate ?? 19} required className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment_terms_days">Zahlungsziel (Tage) *</Label>
                <Input id="payment_terms_days" name="payment_terms_days" type="number" defaultValue={paymentDays ?? 14} required className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={onSkip} className="text-sm text-muted-foreground/70 hover:text-muted-foreground">
                Überspringen
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
