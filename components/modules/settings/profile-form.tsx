"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { updateProfile, updateLanguage, changePassword } from "@/lib/actions/profile"
import { Loader2, Save, KeyRound } from "lucide-react"
import type { UserProfile } from "@/lib/actions/profile"

const LANGUAGES = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
  { value: "pl", label: "Polski" },
  { value: "ro", label: "Română" },
  { value: "tr", label: "Türkçe" },
]

interface ProfileFormProps {
  profile: UserProfile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [langLoading, setLangLoading] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [language, setLanguage] = useState(profile.language ?? "de")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)
    setLoading(false)

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Fehler beim Speichern")
      return
    }

    toast.success("Profil gespeichert")
  }

  async function handleLanguageChange(value: string) {
    setLanguage(value)
    setLangLoading(true)

    const formData = new FormData()
    formData.set("language", value)
    const result = await updateLanguage(formData)
    setLangLoading(false)

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Fehler beim Speichern")
      return
    }

    toast.success("Sprache aktualisiert")
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await changePassword(formData)
    setPasswordLoading(false)

    if (result.error) {
      if (typeof result.error === "string") {
        toast.error(result.error)
      } else {
        const flat = result.error as { fieldErrors?: Record<string, string[]> }
        const first = Object.values(flat.fieldErrors ?? {})[0]?.[0]
        toast.error(first ?? "Fehler beim Ändern des Passworts")
      }
      return
    }

    toast.success("Passwort geändert")
    setPasswordOpen(false)
  }

  return (
    <>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="first_name">Vorname</Label>
                <Input id="first_name" name="first_name" defaultValue={profile.first_name} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name">Nachname</Label>
                <Input id="last_name" name="last_name" defaultValue={profile.last_name} className="h-11 rounded-xl" required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue=""
                className="h-11 rounded-xl bg-muted/50"
                disabled
              />
              <p className="text-xs text-muted-foreground">E-Mail kann nur vom Administrator geändert werden.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} placeholder="+49 170 1234567" className="h-11 rounded-xl" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setPasswordOpen(true)}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Passwort ändern
              </Button>
              <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/80 font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Sprache</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label>Anzeigesprache</Label>
            <Select value={language} onValueChange={(v) => v && handleLanguageChange(v)} disabled={langLoading}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Password change dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Passwort ändern</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                <Input id="currentPassword" name="currentPassword" type="password" className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input id="newPassword" name="newPassword" type="password" placeholder="Mindestens 8 Zeichen" className="h-11 rounded-xl" required minLength={8} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" className="h-11 rounded-xl" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setPasswordOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/80" disabled={passwordLoading}>
                {passwordLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ändern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
