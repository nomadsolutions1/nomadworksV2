"use client"

import { Check } from "lucide-react"

const STEPS = ["Willkommen", "Firma", "Rechnungen", "Team", "Baustelle", "Fertig"]

interface ProgressBarProps {
  currentStep: number
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-xl mx-auto">
      {STEPS.map((label, i) => {
        const step = i + 1
        const isCompleted = step < currentStep
        const isCurrent = step === currentStep
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary text-white"
                    : isCurrent
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-border text-muted-foreground/70"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-medium whitespace-nowrap ${
                  isCurrent ? "text-primary" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/70"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-12 mx-1 transition-all duration-500 ${
                  step < currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
