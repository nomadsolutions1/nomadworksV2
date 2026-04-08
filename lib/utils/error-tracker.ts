import * as Sentry from "@sentry/nextjs"

export function trackError(
  module: string,
  action: string,
  message: string,
  extra?: Record<string, unknown>
): void {
  console.error(`[${module}/${action}] ${message}`)
  Sentry.captureException(new Error(`[${module}/${action}] ${message}`), {
    extra: { module, action, ...extra },
  })
}
