"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingDisplayProps {
  value: number | null | undefined
  size?: "sm" | "md"
  className?: string
}

export function RatingDisplay({ value, size = "md", className }: RatingDisplayProps) {
  const current = value ?? 0
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"

  if (value == null) {
    return <span className="text-xs text-muted-foreground">Nicht bewertet</span>
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            star <= current
              ? "fill-warning text-warning"
              : "text-muted-foreground/40"
          )}
        />
      ))}
      <span className="ml-1.5 text-xs text-muted-foreground">{current} / 5</span>
    </div>
  )
}

interface RatingInputProps {
  name: string
  defaultValue?: number | null
  size?: "sm" | "md"
}

export function RatingInput({ name, defaultValue, size = "md" }: RatingInputProps) {
  const [value, setValue] = useState<number>(defaultValue ?? 0)
  const [hovered, setHovered] = useState<number>(0)
  const starSize = size === "sm" ? "h-5 w-5" : "h-7 w-7"

  const display = hovered || value

  return (
    <>
      <input type="hidden" name={name} value={value || ""} />
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue(value === star ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 rounded transition-transform hover:scale-110"
            aria-label={`${star} Sterne`}
          >
            <Star
              className={cn(
                starSize,
                display >= star
                  ? "fill-warning text-warning"
                  : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">{value} / 5</span>
        )}
      </div>
    </>
  )
}
