"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Building2, Check, X } from "lucide-react"
import { updatePassword } from "@/lib/actions/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const PW_RULES = [
  { label: "Mindestens 8 Zeichen", test: (pw: string) => pw.length >= 8 },
  { label: "Großbuchstabe (A-Z)", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "Kleinbuchstabe (a-z)", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "Zahl (0-9)", test: (pw: string) => /[0-9]/.test(pw) },
  { label: "Sonderzeichen (!@#$%&...)", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein")
      return
    }
    if (password.length < 8) {
      setError("Mindestens 8 Zeichen")
      return
    }

    startTransition(async () => {
      const result = await updatePassword(password)
      if (result.error) {
        setError(result.error)
      } else {
        toast.success("Passwort geändert")
        router.push("/login")
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
            Neues Passwort wählen
          </CardTitle>
          <CardDescription>
            Geben Sie Ihr neues Passwort ein
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <Input
                id="password"
                type="password"
                className="h-11 rounded-xl"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password && (
                <div className="space-y-1 pt-1">
                  {PW_RULES.map(({ label, test }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs ${test(password) ? "text-success" : "text-muted-foreground/70"}`}>
                      {test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Passwort bestätigen</Label>
              <Input
                id="confirm"
                type="password"
                className="h-11 rounded-xl"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-danger">Passwörter stimmen nicht überein</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending || password !== confirm || password.length < 8}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/80 font-semibold"
            >
              {isPending ? "Wird gespeichert..." : "Passwort ändern"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
