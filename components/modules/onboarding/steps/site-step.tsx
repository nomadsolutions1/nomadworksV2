"use client"

import { useTransition } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createSite } from "@/lib/actions/sites"
import { toast } from "sonner"

interface SiteStepProps {
  onNext: (created: boolean) => void
  onSkip: () => void
}

export function SiteStep({ onNext, onSkip }: SiteStepProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (!formData.get("name")?.toString().trim()) {
      toast.error("Bitte einen Baustellennamen eingeben")
      return
    }
    formData.set("status", "active")

    startTransition(async () => {
      const result = await createSite(formData)
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Fehler beim Anlegen")
        return
      }
      toast.success("Baustelle angelegt")
      onNext(true)
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
        <h2 className="text-2xl font-semibold text-foreground">Ihre erste Baustelle</h2>
        <p className="text-sm text-muted-foreground">Optional — Sie können auch später Baustellen anlegen</p>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Baustellenname *</Label>
              <Input id="name" name="name" placeholder="z.B. Neubau Mehrfamilienhaus" className="h-11 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" name="address" placeholder="Straße, PLZ, Stadt" className="h-11 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="budget">Budget (€)</Label>
                <Input id="budget" name="budget" type="number" placeholder="0" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Startdatum</Label>
                <Input id="start_date" name="start_date" type="date" className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={onSkip} className="text-sm text-muted-foreground/70 hover:text-muted-foreground">
                Überspringen
              </button>
              <Button type="submit" disabled={isPending} className="rounded-xl bg-primary hover:bg-primary/80 font-semibold px-8 h-11">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Baustelle anlegen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
