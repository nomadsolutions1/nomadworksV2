import { layout, button, heading, paragraph, muted, escapeHtml } from "./shared"

export type PaymentFailedEmailInput = {
  firstName: string
  amount: string // bereits formatiert, z.B. "249,99 €"
  reason?: string
  billingPortalUrl: string
  gracePeriodDays: number
}

export function paymentFailedEmail(input: PaymentFailedEmailInput) {
  const subject = "Zahlung fehlgeschlagen — bitte Zahlungsmethode prüfen"
  const preheader = `Die Abbuchung über ${input.amount} ist fehlgeschlagen.`

  const reasonLine = input.reason
    ? paragraph(`<strong>Grund laut Bank/Stripe:</strong> ${escapeHtml(input.reason)}`)
    : ""

  const body = [
    heading("Zahlung fehlgeschlagen"),
    paragraph(
      `Guten Tag ${escapeHtml(input.firstName)},<br /><br />die Abbuchung Ihres NomadWorks-Abos über <strong>${escapeHtml(input.amount)}</strong> konnte nicht durchgeführt werden.`,
    ),
    reasonLine,
    paragraph(
      `<strong>Was jetzt tun?</strong><br />Aktualisieren Sie Ihre Zahlungsmethode im Kunden-Portal. Wir versuchen die Abbuchung in den nächsten Tagen automatisch erneut.`,
    ),
    paragraph(
      `<strong>Was passiert, wenn Sie nichts tun?</strong><br />Nach ${input.gracePeriodDays} Tagen ohne erfolgreiche Zahlung wird der Zugang pausiert. Ihre Daten bleiben erhalten — sobald die Zahlung durchläuft, ist alles wieder da.`,
    ),
    button("Zahlungsmethode aktualisieren", input.billingPortalUrl),
    muted("Bei Fragen antworten Sie gerne direkt auf diese E-Mail."),
  ].join("\n")

  return {
    subject,
    html: layout({ title: subject, preheader, body }),
  }
}
