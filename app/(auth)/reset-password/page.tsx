"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Building2, MailCheck } from "lucide-react"
import Link from "next/link"
import { requestPasswordReset } from "@/lib/actions/auth"

export default function ResetPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await requestPasswordReset(email)
      setSent(true)
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
          {sent ? (
            <>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                <MailCheck className="h-7 w-7 text-success" />
              </div>
              <CardTitle className="text-xl font-semibold font-heading">
                E-Mail gesendet
              </CardTitle>
              <CardDescription>
                Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Link zum Zurücksetzen geschickt.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-xl font-semibold font-heading">
                Passwort zurücksetzen
              </CardTitle>
              <CardDescription>
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">Prüfen Sie auch Ihren Spam-Ordner.</p>
              <Link href="/login" className="inline-block text-sm font-medium text-primary hover:underline">
                Zurück zum Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre@email.de"
                  className="h-11 rounded-xl"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/80 font-semibold"
              >
                {isPending ? "Wird gesendet..." : "Link zum Zurücksetzen senden"}
              </Button>
              <p className="text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                  Zurück zum Login
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
