"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

interface CurrencyInputProps {
  name: string
  defaultValue?: number | string | null
  placeholder?: string
  className?: string
  required?: boolean
  max?: number
}

export function CurrencyInput({ name, defaultValue, placeholder, className, required, max }: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => {
    if (!defaultValue) return ""
    const num = typeof defaultValue === "string" ? parseFloat(defaultValue) : defaultValue
    return num ? num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""
  })
  const [rawValue, setRawValue] = useState(defaultValue?.toString() || "")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target.value.replace(/[^\d,.\-]/g, "")
    setDisplay(input)
    const num = parseFloat(input.replace(/\./g, "").replace(",", "."))
    setRawValue(isNaN(num) ? "" : num.toString())
  }

  function handleBlur() {
    const num = parseFloat(rawValue)
    if (!isNaN(num)) {
      setDisplay(num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    }
  }

  return (
    <div className="relative">
      <Input
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || "0,00"}
        className={`${className || "h-11 rounded-xl"} pr-8`}
        required={required}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">&euro;</span>
      <input type="hidden" name={name} value={rawValue} />
    </div>
  )
}
