"use client"

import { useState, useTransition } from "react"
import { login } from "@/lib/actions/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Building2, Shield, Lock } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<Record<string, string[]> | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const fd = new FormData()
    fd.append("email", email)
    fd.append("password", password)

    startTransition(async () => {
      const result = await login(null, fd)
      if (result?.error) {
        setError(result.error)
        setPassword("")
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-foreground font-heading">
          NomadWorks
        </span>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold font-heading">
            Willkommen zurück
          </CardTitle>
          <CardDescription>
            Melden Sie sich bei Ihrem Konto an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Anmeldeformular">
            {error?._form && (
              <div className="rounded-xl bg-danger/10 p-3 text-sm text-danger" role="alert">
                {error._form[0]}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.de"
                className="h-11 rounded-xl"
                required
                aria-required="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error?.email && (
                <p className="text-xs text-danger" role="alert">{error.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ihr Passwort"
                className="h-11 rounded-xl"
                required
                aria-required="true"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error?.password && (
                <p className="text-xs text-danger" role="alert">{error.password[0]}</p>
              )}
              <Link href="/reset-password" className="text-xs text-primary hover:underline">
                Passwort vergessen?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/80 font-semibold"
              aria-label="Anmelden"
            >
              {isPending ? "Wird angemeldet..." : "Anmelden"}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground/70">
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> DSGVO</span>
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> SSL</span>
            <span>Made in Germany</span>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Noch kein Konto?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Registrieren
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
