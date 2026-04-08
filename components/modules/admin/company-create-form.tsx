"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createCompany } from "@/lib/actions/admin"
import { Building2, User, CreditCard, Settings2, ChevronRight, ChevronLeft, Loader2 } from "lucide-react"

const STEPS = [
  { id: 1, title: "Firmendaten", icon: Building2 },
  { id: 2, title: "Geschäftsführer", icon: User },
  { id: 3, title: "Plan", icon: CreditCard },
  { id: 4, title: "Einstellungen", icon: Settings2 },
]

export function CompanyCreateForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Store all form values in React state so step navigation preserves data
  const [formValues, setFormValues] = useState({
    name: "",
    address: "",
    tax_id: "",
    trade_license: "",
    owner_first_name: "",
    owner_last_name: "",
    owner_email: "",
    owner_phone: "",
    owner_password: "",
    plan: "trial",
    max_employees: "",
    monthly_price: "",
    invoice_prefix: "RE",
    default_tax_rate: "19",
    payment_terms_days: "14",
  })

  function updateField(field: string, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    for (const [key, value] of Object.entries(formValues)) {
      if (value) formData.set(key, value)
    }

    const result = await createCompany(formData)
    setLoading(false)

    if (result.error) {
      if (typeof result.error === "string") {
        toast.error(result.error)
      } else {
        toast.error("Bitte alle Pflichtfelder ausfüllen")
      }
      return
    }

    toast.success("Firma erfolgreich angelegt!")
    router.push("/admin")
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              type="button"
              onClick={() => step > s.id - 1 && setStep(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                step === s.id
                  ? "bg-primary text-white"
                  : step > s.id
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.title}
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/70 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Company data */}
      {step === 1 && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Firmendaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="name">Firmenname *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Musterbau GmbH"
                  className="h-11 rounded-xl"
                  required
                  value={formValues.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Musterstraße 1, 10115 Berlin"
                  className="h-11 rounded-xl"
                  value={formValues.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tax_id">Steuernummer</Label>
                <Input
                  id="tax_id"
                  name="tax_id"
                  placeholder="12/345/67890"
                  className="h-11 rounded-xl"
                  value={formValues.tax_id}
                  onChange={(e) => updateField("tax_id", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="trade_license">Gewerbeschein-Nr.</Label>
                <Input
                  id="trade_license"
                  name="trade_license"
                  placeholder="GWB-2024-001"
                  className="h-11 rounded-xl"
                  value={formValues.trade_license}
                  onChange={(e) => updateField("trade_license", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Owner */}
      {step === 2 && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Geschäftsführer-Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="owner_first_name">Vorname *</Label>
                <Input
                  id="owner_first_name"
                  name="owner_first_name"
                  placeholder="Max"
                  className="h-11 rounded-xl"
                  required
                  value={formValues.owner_first_name}
                  onChange={(e) => updateField("owner_first_name", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="owner_last_name">Nachname *</Label>
                <Input
                  id="owner_last_name"
                  name="owner_last_name"
                  placeholder="Mustermann"
                  className="h-11 rounded-xl"
                  required
                  value={formValues.owner_last_name}
                  onChange={(e) => updateField("owner_last_name", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="owner_email">E-Mail *</Label>
                <Input
                  id="owner_email"
                  name="owner_email"
                  type="email"
                  placeholder="max@musterbau.de"
                  className="h-11 rounded-xl"
                  required
                  value={formValues.owner_email}
                  onChange={(e) => updateField("owner_email", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="owner_phone">Telefon</Label>
                <Input
                  id="owner_phone"
                  name="owner_phone"
                  placeholder="+49 170 1234567"
                  className="h-11 rounded-xl"
                  value={formValues.owner_phone}
                  onChange={(e) => updateField("owner_phone", e.target.value)}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="owner_password">Passwort *</Label>
                <Input
                  id="owner_password"
                  name="owner_password"
                  type="password"
                  placeholder="Mindestens 8 Zeichen"
                  className="h-11 rounded-xl"
                  required
                  minLength={8}
                  value={formValues.owner_password}
                  onChange={(e) => updateField("owner_password", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Plan */}
      {step === 3 && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Plan & Abonnement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { value: "trial", label: "Trial", price: "0 €/Monat", employees: "bis 5 MA", color: "#64748b" },
                { value: "starter", label: "Starter", price: "149,99 €/Monat", employees: "bis 10 MA", color: "#3b82f6" },
                { value: "business", label: "Business", price: "249,99 €/Monat", employees: "bis 30 MA", color: "#1e3a5f" },
                { value: "enterprise", label: "Enterprise", price: "499,99 €/Monat", employees: "bis 100 MA", color: "#8b5cf6" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => updateField("plan", p.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formValues.plan === p.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="font-semibold text-foreground">{p.label}</p>
                  <p className="text-sm text-foreground/80 mt-1">{p.price}</p>
                  <p className="text-xs text-muted-foreground">{p.employees}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-1">
                <Label htmlFor="max_employees">Max. Mitarbeiter (überschreiben)</Label>
                <Input
                  id="max_employees"
                  name="max_employees"
                  type="number"
                  placeholder="Standard laut Plan"
                  className="h-11 rounded-xl"
                  value={formValues.max_employees}
                  onChange={(e) => updateField("max_employees", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="monthly_price">Monatspreis (überschreiben)</Label>
                <Input
                  id="monthly_price"
                  name="monthly_price"
                  type="number"
                  step="0.01"
                  placeholder="Standard laut Plan"
                  className="h-11 rounded-xl"
                  value={formValues.monthly_price}
                  onChange={(e) => updateField("monthly_price", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Settings */}
      {step === 4 && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Rechnungseinstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="invoice_prefix">Rechnungspräfix</Label>
                <Input
                  id="invoice_prefix"
                  name="invoice_prefix"
                  placeholder="RE"
                  className="h-11 rounded-xl"
                  value={formValues.invoice_prefix}
                  onChange={(e) => updateField("invoice_prefix", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="default_tax_rate">Steuersatz (%)</Label>
                <Input
                  id="default_tax_rate"
                  name="default_tax_rate"
                  type="number"
                  className="h-11 rounded-xl"
                  value={formValues.default_tax_rate}
                  onChange={(e) => updateField("default_tax_rate", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="payment_terms_days">Zahlungsziel (Tage)</Label>
                <Input
                  id="payment_terms_days"
                  name="payment_terms_days"
                  type="number"
                  className="h-11 rounded-xl"
                  value={formValues.payment_terms_days}
                  onChange={(e) => updateField("payment_terms_days", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => step > 1 ? setStep(step - 1) : router.push("/admin")}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {step === 1 ? "Abbrechen" : "Zurück"}
        </Button>

        {step < 4 ? (
          <Button
            type="button"
            className="rounded-xl bg-primary hover:bg-primary/80 font-semibold"
            onClick={() => setStep(step + 1)}
          >
            Weiter
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="submit"
            className="rounded-xl bg-primary hover:bg-primary/80 font-semibold"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Firma anlegen
          </Button>
        )}
      </div>
    </form>
  )
}
