"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Clock, Building2, Euro } from "lucide-react"

interface WelcomeStepProps {
  firstName: string
  onNext: () => void
}

const features = [
  { icon: Clock, label: "Zeiterfassung" },
  { icon: Building2, label: "Baustellen verwalten" },
  { icon: Euro, label: "Kosten im Blick" },
]

export function WelcomeStep({ firstName, onNext }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center max-w-lg mx-auto space-y-8"
    >
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-foreground font-heading">
          Willkommen bei NomadWorks{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          In wenigen Schritten richten wir Ihr Unternehmen ein. Das dauert nur 2 Minuten.
        </p>
      </div>

      <div className="flex justify-center gap-8">
        {features.map(({ icon: Icon, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground/80">{label}</span>
          </motion.div>
        ))}
      </div>

      <Button
        onClick={onNext}
        className="rounded-xl bg-primary hover:bg-primary/80 font-semibold px-8 h-11"
      >
        Los geht&apos;s
      </Button>
    </motion.div>
  )
}
