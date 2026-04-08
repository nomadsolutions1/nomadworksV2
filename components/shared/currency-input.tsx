"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"

interface CurrencyInputProps {
  name: string
  defaultValue?: number | string | null
  placeholder?: string
  className?: string
  required?: boolean
  max?: number
  onValueChange?: (value: number | null) => void
}

function formatWhileTyping(raw: string): { display: string; numeric: number | null } {
  // Remove everything except digits and comma
  const cleaned = raw.replace(/[^\d,]/g, "")

  if (!cleaned) return { display: "", numeric: null }

  // Split on comma (decimal separator)
  const parts = cleaned.split(",")
  const integerPart = parts[0] || ""
  const decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : undefined

  // Add thousand separators to integer part
  const withSeparators = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  // Build display string
  const display = decimalPart !== undefined
    ? `${withSeparators},${decimalPart}`
    : withSeparators

  // Build numeric value
  const numStr = decimalPart !== undefined
    ? `${integerPart}.${decimalPart}`
    : integerPart
  const numeric = numStr ? parseFloat(numStr) : null

  return { display, numeric: numeric !== null && isNaN(numeric) ? null : numeric }
}

function formatInitial(value: number | string | null | undefined): { display: string; raw: string } {
  if (!value) return { display: "", raw: "" }
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return { display: "", raw: "" }
  return {
    display: num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    raw: num.toString(),
  }
}

export function CurrencyInput({ name, defaultValue, placeholder, className, required, onValueChange }: CurrencyInputProps) {
  const initial = formatInitial(defaultValue)
  const [display, setDisplay] = useState(initial.display)
  const [rawValue, setRawValue] = useState(initial.raw)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target.value
    const cursorPos = e.target.selectionStart || 0

    // Count digits before cursor in old value
    const oldDigitsBefore = display.slice(0, cursorPos).replace(/[^\d,]/g, "").length

    const { display: newDisplay, numeric } = formatWhileTyping(input)
    setDisplay(newDisplay)
    setRawValue(numeric !== null ? numeric.toString() : "")
    onValueChange?.(numeric)

    // Restore cursor position after formatting
    requestAnimationFrame(() => {
      if (inputRef.current) {
        let digitCount = 0
        let newPos = 0
        for (let i = 0; i < newDisplay.length; i++) {
          if (/[\d,]/.test(newDisplay[i])) digitCount++
          if (digitCount >= oldDigitsBefore) { newPos = i + 1; break }
        }
        if (digitCount < oldDigitsBefore) newPos = newDisplay.length
        inputRef.current.setSelectionRange(newPos, newPos)
      }
    })
  }

  function handleBlur() {
    // On blur, ensure proper 2-decimal format
    const num = parseFloat(rawValue)
    if (!isNaN(num) && num > 0) {
      setDisplay(num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || "0,00"}
        className={`${className || "h-11 rounded-xl"} pr-8`}
        required={required}
        inputMode="decimal"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
      <input type="hidden" name={name} value={rawValue} />
    </div>
  )
}
