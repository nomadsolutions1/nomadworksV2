import { layout, button, heading, paragraph, muted, escapeHtml } from "./shared"

export type PasswordResetEmailInput = {
  firstName?: string
  resetUrl: string
  validMinutes?: number
}

export function passwordResetEmail(input: PasswordResetEmailInput) {
  const valid = input.validMinutes ?? 60
  const subject = "Passwort zurücksetzen"
  const preheader = `Link zum Zurücksetzen Ihres NomadWorks-Passworts.`

  const greeting = input.firstName
    ? `Guten Tag ${escapeHtml(input.firstName)},`
    : "Guten Tag,"

  const body = [
    heading("Passwort zurücksetzen"),
    paragraph(
      `${greeting}<br /><br />Sie haben angefordert, Ihr NomadWorks-Passwort zurückzusetzen. Klicken Sie auf den Button, um ein neues Passwort zu vergeben.`,
    ),
    button("Neues Passwort vergeben", input.resetUrl),
    paragraph(
      `Der Link ist aus Sicherheitsgründen <strong>${valid} Minuten</strong> gültig. Danach müssen Sie eine neue Anforderung stellen.`,
    ),
    muted(
      "Wenn Sie diese Anforderung nicht gestellt haben, ignorieren Sie diese E-Mail einfach. Ihr Passwort bleibt unverändert.",
    ),
  ].join("\n")

  return {
    subject,
    html: layout({ title: subject, preheader, body }),
  }
}
