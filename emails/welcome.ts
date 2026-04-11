import { layout, button, heading, paragraph, muted, escapeHtml } from "./shared"

export type WelcomeEmailInput = {
  firstName: string
  companyName: string
  dashboardUrl: string
}

export function welcomeEmail(input: WelcomeEmailInput) {
  const subject = "Willkommen bei NomadWorks — die ersten Schritte"
  const preheader = `Ihr Konto für ${input.companyName} ist startklar.`

  const body = [
    heading(`Willkommen, ${escapeHtml(input.firstName)}`),
    paragraph(
      `Ihr Konto für <strong>${escapeHtml(input.companyName)}</strong> ist startklar. Damit Sie schnell loslegen können, hier die drei ersten Schritte:`,
    ),
    `<ol style="margin:0 0 16px 0;padding-left:20px;line-height:1.7;">
      <li><strong>Firma einrichten</strong> — Logo, Adresse und Steuer-Nummer eintragen.</li>
      <li><strong>Ersten Mitarbeiter anlegen</strong> — Name, Rolle und Stundensatz.</li>
      <li><strong>Erste Baustelle erstellen</strong> — schon können Ihre Leute stempeln.</li>
    </ol>`,
    button("Jetzt starten", input.dashboardUrl),
    paragraph(
      "Sie haben 7 Tage Testzeit mit vollem Funktionsumfang. Es wird nichts automatisch abgebucht.",
    ),
    muted(
      "Sie kommen nicht weiter? Antworten Sie einfach auf diese E-Mail — wir helfen persönlich.",
    ),
  ].join("\n")

  return {
    subject,
    html: layout({ title: subject, preheader, body }),
  }
}
