"use client"

import { cn } from "@/lib/utils"
import { WEATHER_OPTIONS } from "@/lib/utils/constants"

interface WeatherPickerProps {
  value: string | null
  onChange: (value: string | null) => void
}

export function WeatherPicker({ value, onChange }: WeatherPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {WEATHER_OPTIONS.map((option) => {
        const isSelected = value === option.label
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(isSelected ? null : option.label)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
              isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted"
            )}
          >
            <span className="text-base leading-none">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
