"use client"

import { toast } from "sonner"

type ActionResult = {
  error?: string | Record<string, string[]>
}

/**
 * Show a toast for a server action error result.
 * Handles both string errors and Zod field-error records.
 *
 * @returns true if an error was shown, false otherwise
 */
export function showActionError(result: ActionResult): boolean {
  if (!result.error) return false

  if (typeof result.error === "string") {
    toast.error(result.error)
    return true
  }

  // Field errors from Zod flatten — format them nicely
  const lines: string[] = []
  for (const [field, messages] of Object.entries(result.error)) {
    if (Array.isArray(messages) && messages.length > 0) {
      lines.push(`${field}: ${messages.join(", ")}`)
    }
  }

  if (lines.length > 0) {
    toast.error("Validierungsfehler", {
      description: lines.join("\n"),
    })
  } else {
    toast.error("Ein unbekannter Fehler ist aufgetreten")
  }

  return true
}
