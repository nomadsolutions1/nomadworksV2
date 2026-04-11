import { layout, button, heading, paragraph, muted, escapeHtml } from "./shared"

export type TrialExpiringEmailInput = {
  firstName: string
  daysLeft: number
  upgradeUrl: string
}

export function trialExpiringEmail(input: TrialExpiringEmailInput) {
  const subject = `Ihr Test läuft in ${input.daysLeft} Tagen ab`
  const preheader = `Nur noch ${input.daysLeft} Tage Testzeit bei NomadWorks.`

  const body = [
    heading(`Nur noch ${input.daysLeft} Tage Testzeit`),
    paragraph(
      `Guten Tag ${escapeHtml(input.firstName)},<br /><br />Ihre kostenlose Testphase läuft in <strong>${input.daysLeft} Tagen</strong> ab. Damit Sie nahtlos weiterarbeiten können, wählen Sie jetzt einen passenden Tarif.`,
    ),
    paragraph(
      "<strong>Was passiert, wenn Sie nichts tun?</strong><br />Nach Ablauf der Testphase wird der Zugang eingeschränkt. Ihre Daten bleiben erhalten — Sie können später jederzeit upgraden. Es wird keine Zahlung automatisch eingezogen.",
    ),
    paragraph("<strong>Was passiert, wenn Sie upgraden?</strong><br />Sie behalten vollen Zugriff, Abrechnung erfolgt monatlich im Voraus. Kündigung ist jederzeit zum Monatsende möglich."),
    button("Jetzt Tarif wählen", input.upgradeUrl),
    muted(
      "Noch Fragen? Antworten Sie einfach auf diese E-Mail — wir helfen gerne.",
    ),
  ].join("\n")

  return {
    subject,
    html: layout({ title: subject, preheader, body }),
  }
}
