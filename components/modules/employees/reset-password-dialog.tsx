"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { resetEmployeePassword } from "@/lib/actions/employees"

interface ResetPasswordDialogProps {
  employeeId: string
  employeeName: string
}

export function ResetPasswordDialog({ employeeId, employeeName }: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (password.length < 8) { toast.error("Passwort muss mindestens 8 Zeichen haben"); return }
    startTransition(async () => {
      const result = await resetEmployeePassword(employeeId, password)
      if (result.error) { toast.error(result.error) } else {
        toast.success(`Passwort fuer ${employeeName} wurde zurueckgesetzt`)
        setPassword("")
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="rounded-xl gap-1.5" />}>
        <KeyRound className="h-4 w-4" /> Passwort zuruecksetzen
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Passwort zuruecksetzen</DialogTitle>
          <DialogDescription>Neues Passwort fuer {employeeName} festlegen.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Neues Passwort</Label>
            <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mindestens 8 Zeichen" className="h-11 rounded-xl" minLength={8} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button className="rounded-xl" onClick={handleSubmit} disabled={isPending || password.length < 8}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Passwort setzen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
