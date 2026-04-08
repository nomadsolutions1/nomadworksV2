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
  onValueChange?: (value: number | null) => void
}

function addThousandSeparators(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target
    const oldValue = display
    const inputValue = el.value
    const cursorPos = el.selectionStart ?? inputValue.length

    // Strip everything except digits and comma
    const cleaned = inputValue.replace(/[^\d,]/g, "")
    if (!cleaned) {
      setDisplay("")
      setRawValue("")
      onValueChange?.(null)
      return
    }

    // Split integer and decimal
    const parts = cleaned.split(",")
    const integerRaw = parts[0] || ""
    const decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : undefined

    // Format integer with thousand separators
    const integerFormatted = addThousandSeparators(integerRaw)

    // Build display
    const newDisplay = decimalPart !== undefined
      ? `${integerFormatted},${decimalPart}`
      : integerFormatted

    // Calculate numeric value
    const numStr = decimalPart !== undefined ? `${integerRaw}.${decimalPart}` : integerRaw
    const numeric = numStr ? parseFloat(numStr) : null
    const safeNumeric = numeric !== null && !isNaN(numeric) ? numeric : null

    setDisplay(newDisplay)
    setRawValue(safeNumeric !== null ? safeNumeric.toString() : "")
    onValueChange?.(safeNumeric)

    // Fix cursor position: count how many digits+commas are before cursor in the INPUT value
    const beforeCursor = inputValue.slice(0, cursorPos)
    const significantBefore = beforeCursor.replace(/[^\d,]/g, "").length

    // Find the same position in the new formatted value
    let count = 0
    let newCursorPos = 0
    for (let i = 0; i < newDisplay.length; i++) {
      if (/[\d,]/.test(newDisplay[i])) count++
      if (count >= significantBefore) {
        newCursorPos = i + 1
        break
      }
    }
    if (count < significantBefore) newCursorPos = newDisplay.length

    // Use setTimeout to set cursor after React re-render
    setTimeout(() => {
      el.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  function handleBlur() {
    const num = parseFloat(rawValue)
    if (!isNaN(num) && num > 0) {
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
        inputMode="decimal"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
      <input type="hidden" name={name} value={rawValue} />
    </div>
  )
}
