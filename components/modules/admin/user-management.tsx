"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { updateUser, resetUserPassword, deleteUser } from "@/lib/actions/admin"
import { Pencil, KeyRound, Trash2, Loader2 } from "lucide-react"
import type { AdminUser } from "@/lib/actions/admin"
import { ROLES } from "@/lib/utils/constants"

interface UserManagementProps {
  user: AdminUser
}

export function UserManagement({ user }: UserManagementProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(user.role)

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("id", user.id)
    formData.set("role", role)

    const result = await updateUser(formData)
    setLoading(false)

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Fehler beim Speichern")
      return
    }

    toast.success("Benutzer aktualisiert")
    setEditOpen(false)
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("userId", user.id)

    const result = await resetUserPassword(formData)
    setLoading(false)

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Fehler beim Zurücksetzen")
      return
    }

    toast.success("Passwort zurückgesetzt")
    setPasswordOpen(false)
  }

  async function handleDelete() {
    setLoading(true)
    const result = await deleteUser(user.id)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Benutzer gelöscht")
    setDeleteOpen(false)
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setPasswordOpen(true)}>
          <KeyRound className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg text-danger hover:text-danger hover:bg-danger/10"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
            <DialogDescription>Daten von {user.first_name} {user.last_name} ändern</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit_first_name">Vorname</Label>
                  <Input id="edit_first_name" name="first_name" defaultValue={user.first_name} className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit_last_name">Nachname</Label>
                  <Input id="edit_last_name" name="last_name" defaultValue={user.last_name} className="h-11 rounded-xl" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit_email">E-Mail</Label>
                <Input id="edit_email" name="email" type="email" defaultValue={user.email} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit_phone">Telefon</Label>
                <Input id="edit_phone" name="phone" defaultValue={user.phone ?? ""} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label>Rolle</Label>
                <Select value={role} onValueChange={(v) => v && setRole(v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/80" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
            <DialogDescription>Neues Passwort für {user.first_name} {user.last_name} setzen</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="Mindestens 8 Zeichen"
                  className="h-11 rounded-xl"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setPasswordOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/80" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Zurücksetzen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Benutzer löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie <strong>{user.first_name} {user.last_name}</strong> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="rounded-xl bg-danger hover:bg-danger/80"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
