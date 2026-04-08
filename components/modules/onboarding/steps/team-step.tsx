"use client"

import { useState, useTransition } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, X } from "lucide-react"
import { createEmployee } from "@/lib/actions/employees"
import { toast } from "sonner"

interface TeamStepProps {
  onNext: (createdCount: number) => void
  onSkip: () => void
}

type MemberForm = {
  id: string
  firstName: string
  lastName: string
  role: string
  email: string
  hourlyRate: string
}

function emptyMember(): MemberForm {
  return { id: crypto.randomUUID(), firstName: "", lastName: "", role: "worker", email: "", hourlyRate: "" }
}

export function TeamStep({ onNext, onSkip }: TeamStepProps) {
  const [isPending, startTransition] = useTransition()
  const [members, setMembers] = useState<MemberForm[]>([emptyMember()])

  function addMember() {
    if (members.length < 5) setMembers([...members, emptyMember()])
  }

  function removeMember(id: string) {
    setMembers(members.filter((m) => m.id !== id))
  }

  function updateMember(id: string, field: keyof MemberForm, value: string) {
    setMembers(members.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
  }

  function handleSubmit() {
    const valid = members.filter((m) => m.firstName.trim() && m.lastName.trim())
    if (valid.length === 0) {
      toast.error("Bitte mindestens einen Mitarbeiter ausfüllen")
      return
    }

    startTransition(async () => {
      let created = 0
      for (const m of valid) {
        const fd = new FormData()
        fd.set("first_name", m.firstName)
        fd.set("last_name", m.lastName)
        fd.set("role", m.role)
        if (m.email) fd.set("email", m.email)
        if (m.hourlyRate) fd.set("hourly_rate", m.hourlyRate)
        fd.set("status", "active")

        const result = await createEmployee(fd)
        if (result.success) {
          created++
        } else {
          toast.error(`Fehler bei ${m.firstName} ${m.lastName}`)
        }
      }
      if (created > 0) {
        toast.success(`${created} Mitarbeiter angelegt`)
      }
      onNext(created)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-semibold text-foreground">Fügen Sie Ihr Team hinzu</h2>
        <p className="text-sm text-muted-foreground">Sie können jederzeit weitere Mitarbeiter hinzufügen</p>
      </div>

      <div className="space-y-3">
        {members.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Vorname *</Label>
                      <Input
                        value={member.firstName}
                        onChange={(e) => updateMember(member.id, "firstName", e.target.value)}
                        className="h-9 rounded-lg text-sm"
                        placeholder="Vorname"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nachname *</Label>
                      <Input
                        value={member.lastName}
                        onChange={(e) => updateMember(member.id, "lastName", e.target.value)}
                        className="h-9 rounded-lg text-sm"
                        placeholder="Nachname"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rolle *</Label>
                      <Select value={member.role} onValueChange={(v) => updateMember(member.id, "role", v ?? "worker")}>
                        <SelectTrigger className="h-9 rounded-lg text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="foreman">Bauleiter</SelectItem>
                          <SelectItem value="worker">Bauarbeiter</SelectItem>
                          <SelectItem value="office">Verwaltung</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">E-Mail</Label>
                      <Input
                        value={member.email}
                        onChange={(e) => updateMember(member.id, "email", e.target.value)}
                        className="h-9 rounded-lg text-sm"
                        placeholder="Optional"
                        type="email"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">€/Std.</Label>
                      <Input
                        value={member.hourlyRate}
                        onChange={(e) => updateMember(member.id, "hourlyRate", e.target.value)}
                        className="h-9 rounded-lg text-sm"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>
                  {members.length > 1 && (
                    <button onClick={() => removeMember(member.id)} className="mt-5 p-1 text-muted-foreground/70 hover:text-danger">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {members.length < 5 && (
        <button
          onClick={addMember}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 mx-auto"
        >
          <Plus className="h-4 w-4" />
          Weiterer Mitarbeiter
        </button>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onSkip} className="text-sm text-muted-foreground/70 hover:text-muted-foreground">
          Überspringen
        </button>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-xl bg-primary hover:bg-primary/80 font-semibold px-8 h-11"
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Weiter
        </Button>
      </div>
    </motion.div>
  )
}
