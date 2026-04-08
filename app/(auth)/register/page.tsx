"use client"

import { useState, useTransition } from "react"
import { register } from "@/lib/actions/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check, X, Clock, MapPin, Users, TrendingUp, Receipt, Truck, Building2, Shield, Lock, Server } from "lucide-react"
import Link from "next/link"

// ─── Password Strength ──────────────────────────────────────

const PW_RULES = [
  { label: "Mindestens 8 Zeichen", test: (pw: string) => pw.length >= 8 },
  { label: "Großbuchstabe (A-Z)", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "Kleinbuchstabe (a-z)", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "Zahl (0-9)", test: (pw: string) => /[0-9]/.test(pw) },
  { label: "Sonderzeichen (!@#$%&...)", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const allPassed = PW_RULES.every((r) => r.test(password))

  return (
    <div className="space-y-1 pt-1">
      {PW_RULES.map(({ label, test }) => {
        const passed = test(password)
        return (
          <div key={label} className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${passed ? "text-success" : "text-muted-foreground/70"}`}>
            {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {label}
          </div>
        )
      })}
      {allPassed && (
        <p className="text-xs font-medium text-success pt-0.5">Starkes Passwort</p>
      )}
    </div>
  )
}

// ─── Features ───────────────────────────────────────────────

const FEATURES = [
  { icon: Clock, label: "Digitale Zeiterfassung mit GPS" },
  { icon: MapPin, label: "Baustellen & Disposition" },
  { icon: Users, label: "Team- & Rollenverwaltung" },
  { icon: TrendingUp, label: "Automatische Kostenberechnung" },
  { icon: Receipt, label: "Rechnungen & Mahnwesen" },
  { icon: Truck, label: "Fuhrpark & Lagerverwaltung" },
]

// ─── Page ───────────────────────────────────────────────────

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState<Record<string, string[]> | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)

  function update(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const fd = new FormData()
    fd.append("companyName", formData.companyName)
    fd.append("firstName", formData.firstName)
    fd.append("lastName", formData.lastName)
    fd.append("email", formData.email)
    fd.append("password", formData.password)

    startTransition(async () => {
      const result = await register(null, fd)
      if (result?.error) {
        setError(result.error)
        setFormData((prev) => ({ ...prev, password: "" }))
      }
    })
  }

  return (
    <div className="w-full max-w-[1100px] mx-auto">
      <div className="flex flex-col xl:flex-row gap-8 xl:gap-0 items-stretch">
        {/* ── Left: Form ─────────────────────────────── */}
        <div className="flex-1 xl:pr-8">
          {/* Logo — always visible */}
          <div className="flex items-center gap-2 mb-8 justify-center xl:justify-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground font-heading">
              NomadWorks
            </span>
          </div>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold font-heading">
                Kostenlos registrieren
              </CardTitle>
              <CardDescription>
                Starten Sie in 2 Minuten — keine Kreditkarte erforderlich
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error?._form && (
                  <div className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
                    {error._form[0]}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="companyName">Firmenname</Label>
                  <Input
                    id="companyName"
                    placeholder="Musterbau GmbH"
                    className="h-11 rounded-xl"
                    required
                    value={formData.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                  />
                  {error?.companyName && <p className="text-xs text-danger">{error.companyName[0]}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input
                      id="firstName"
                      placeholder="Max"
                      className="h-11 rounded-xl"
                      required
                      value={formData.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                    />
                    {error?.firstName && <p className="text-xs text-danger">{error.firstName[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input
                      id="lastName"
                      placeholder="Mustermann"
                      className="h-11 rounded-xl"
                      required
                      value={formData.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                    />
                    {error?.lastName && <p className="text-xs text-danger">{error.lastName[0]}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ihre@email.de"
                    className="h-11 rounded-xl"
                    required
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                  {error?.email && <p className="text-xs text-danger">{error.email[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mindestens 8 Zeichen"
                    className="h-11 rounded-xl"
                    required
                    value={formData.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  {error?.password && <p className="text-xs text-danger">{error.password[0]}</p>}
                  <PasswordStrength password={formData.password} />
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                    Ich stimme den{" "}
                    <a href="/agb" target="_blank" className="text-primary underline">AGB</a> und der{" "}
                    <a href="/datenschutz" target="_blank" className="text-primary underline">Datenschutzerklärung</a> zu.
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isPending || !termsAccepted}
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/80 font-semibold"
                >
                  {isPending ? "Wird erstellt..." : "Kostenlos testen"}
                </Button>

                <p className="text-center text-xs text-muted-foreground/70">
                  Bereits 50+ Bauunternehmen vertrauen NomadWorks
                </p>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Bereits ein Konto?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Anmelden
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Features (desktop only) ─────────── */}
        <div className="hidden xl:block w-[420px] shrink-0">
          <div className="bg-primary rounded-2xl p-10 text-white h-full flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1 font-heading">
                Alles was Ihr Bauunternehmen braucht
              </h2>
              <p className="text-white/60 text-sm mb-8">
                Das Bau-ERP für moderne Unternehmen
              </p>

              <div>
                {FEATURES.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-4 py-4 border-b border-white/10 last:border-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="h-5 w-5 text-white/90" />
                    </div>
                    <span className="text-[15px] font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2.5 text-white/80 text-xs">
                <Shield className="h-4 w-4 shrink-0" />
                <span>DSGVO-konform</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/80 text-xs">
                <span className="text-base leading-none">🇩🇪</span>
                <span>Made & Hosted in Germany</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/80 text-xs">
                <Lock className="h-4 w-4 shrink-0" />
                <span>256-Bit SSL-Verschlüsselung</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/80 text-xs">
                <Server className="h-4 w-4 shrink-0" />
                <span>Daten in Frankfurt (EU)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
