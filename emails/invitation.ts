import { layout, button, heading, paragraph, muted, escapeHtml } from "./shared"

export type InvitationEmailInput = {
  inviterName: string
  companyName: string
  recipientEmail: string
  role: string
  acceptUrl: string
}

/**
 * Rolle-zu-Beschreibung — bewusst in Klaus-Sprache ohne Fachbegriffe.
 */
function describeRole(role: string): string {
  const map: Record<string, string> = {
    owner: "Geschäftsführer (vollständiger Zugriff)",
    admin: "Administrator (kann alles außer Firma löschen)",
    accountant: "Buchhaltung (Rechnungen und Zahlen)",
    foreman: "Polier (Baustellen und Teams)",
    worker: "Mitarbeiter (Zeiterfassung und eigene Baustellen)",
    driver: "Fahrer (Fuhrpark und Fahrten)",
  }
  return map[role.toLowerCase()] ?? role
}

export function invitationEmail(input: InvitationEmailInput) {
  const subject = `Sie wurden zu ${input.companyName} eingeladen`
  const preheader = `${input.inviterName} hat Sie zu NomadWorks eingeladen.`

  const body = [
    heading("Sie wurden eingeladen"),
    paragraph(
      `Guten Tag,<br /><br /><strong>${escapeHtml(input.inviterName)}</strong> hat Sie zum NomadWorks-Konto der Firma <strong>${escapeHtml(input.companyName)}</strong> eingeladen.`,
    ),
    paragraph(
      `Ihre Rolle: <strong>${escapeHtml(describeRole(input.role))}</strong>`,
    ),
    paragraph(
      "Klicken Sie auf den Button, um Ihr Konto einzurichten und ein Passwort zu vergeben. Der Link ist 7 Tage gültig.",
    ),
    button("Einladung annehmen", input.acceptUrl),
    muted(
      `Wenn Sie die Einladung nicht erwartet haben, können Sie diese E-Mail einfach ignorieren. Es passiert nichts, solange Sie den Link nicht anklicken.`,
    ),
  ].join("\n")

  return {
    subject,
    html: layout({ title: subject, preheader, body }),
  }
}
