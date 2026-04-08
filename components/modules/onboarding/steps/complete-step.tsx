"use client"

import { useTransition } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Loader2, Lightbulb } from "lucide-react"
import { completeOnboarding } from "@/lib/actions/onboarding"
import { useRouter } from "next/navigation"

interface CompleteStepProps {
  companyName: string
  employeesCreated: number
  siteCreated: boolean
}

export function CompleteStep({ companyName, employeesCreated, siteCreated }: CompleteStepProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleFinish() {
    startTransition(async () => {
      await completeOnboarding()
      router.push("/dashboard")
    })
  }

  const items = [
    { label: `Firma: ${companyName}`, done: true },
    {
      label: employeesCreated > 0
        ? `${employeesCreated} Mitarbeiter angelegt`
        : "Noch keine Mitarbeiter",
      done: employeesCreated > 0,
    },
    {
      label: siteCreated ? "Erster Auftrag angelegt" : "Noch kein Auftrag",
      done: siteCreated,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center max-w-lg mx-auto space-y-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
      >
        <Check className="h-10 w-10 text-success" strokeWidth={3} />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-foreground">Alles eingerichtet!</h2>
        <p className="text-muted-foreground">Ihr NomadWorks ist bereit.</p>
      </div>

      <div className="space-y-2 text-left max-w-xs mx-auto">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-2"
          >
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              item.done ? "bg-success" : "bg-border"
            }`}>
              {item.done && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className={`text-sm ${item.done ? "text-foreground/80" : "text-muted-foreground/70"}`}>
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="rounded-2xl border-accent/30 bg-accent/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-accent-foreground text-left">
              <span className="font-medium">Tipp:</span> Nutzen Sie die Disposition um Mitarbeiter Baustellen zuzuweisen.
              Ihre Arbeiter sehen die Zuweisung automatisch in der Stempeluhr.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Button
        onClick={handleFinish}
        disabled={isPending}
        className="rounded-xl bg-primary hover:bg-primary/80 font-semibold px-10 h-11"
      >
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Zum Dashboard
      </Button>
    </motion.div>
  )
}
