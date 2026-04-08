import type { Metadata } from "next"

export const metadata: Metadata = { title: "Datenschutzerklärung — NomadWorks" }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

export default function DatenschutzPage() {
  return (
    <article className="space-y-8 text-foreground/80 text-sm leading-relaxed">
      <h1 className="text-3xl font-semibold text-foreground">Datenschutzerklärung</h1>
      <p>Stand: April 2026</p>

      <Section title="1. Verantwortlicher">
        <p>
          Nomad Solutions UG (haftungsbeschränkt)<br />
          Hochstr. 17, 47228 Duisburg<br />
          E-Mail: <a href="mailto:kontakt@nomad-solutions.de" className="text-primary hover:underline">kontakt@nomad-solutions.de</a><br />
          Geschäftsführer: Mikail Sünger
        </p>
      </Section>

      <Section title="2. Welche Daten wir erheben">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Bestandsdaten:</strong> Name, E-Mail-Adresse, Firmenname, Adresse, Telefonnummer</li>
          <li><strong>Nutzungsdaten:</strong> Zeitstempel, IP-Adresse, Browser-Typ, Gerätetyp</li>
          <li><strong>Vertragsdaten:</strong> Gewählter Plan, Abrechnungsinformationen</li>
          <li><strong>Zahlungsdaten:</strong> Werden ausschließlich von Stripe Inc. verarbeitet — wir speichern keine Kreditkarten- oder Kontodaten</li>
          <li><strong>Mitarbeiterdaten:</strong> Name, Rolle, Stundensatz, Zeiteinträge, GPS-Standort beim Stempeln (im Auftrag des Kunden als Auftragsverarbeiter)</li>
        </ul>
      </Section>

      <Section title="3. Zweck der Verarbeitung">
        <ul className="list-disc pl-5 space-y-1">
          <li>Bereitstellung und Betrieb der NomadWorks SaaS-Plattform</li>
          <li>Vertragserfüllung und Abrechnung</li>
          <li>Kundenservice und technischer Support</li>
          <li>Sicherheit und Missbrauchsprävention</li>
          <li>Erfüllung gesetzlicher Pflichten (Buchhaltung, Aufbewahrung)</li>
        </ul>
      </Section>

      <Section title="4. Rechtsgrundlage">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — Vertragserfüllung (Bereitstellung der Software)</li>
          <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> — Einwilligung (z.B. GPS-Standort beim Stempeln)</li>
          <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> — Berechtigtes Interesse (Sicherheit, Betriebsoptimierung)</li>
          <li><strong>Art. 6 Abs. 1 lit. c DSGVO</strong> — Rechtliche Verpflichtung (steuerliche Aufbewahrung)</li>
        </ul>
      </Section>

      <Section title="5. Empfänger und Auftragsverarbeiter">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Vercel Inc.</strong> (San Francisco, USA) — Application Hosting und CDN.
            Datenverarbeitung auf Basis von EU-Standardvertragsklauseln. Serverless Functions laufen in EU (Frankfurt).
          </li>
          <li>
            <strong>Supabase Inc.</strong> — PostgreSQL Datenbank gehostet in EU (Frankfurt, aws-eu-central-1).
            Auftragsverarbeitung nach Art. 28 DSGVO.
          </li>
          <li>
            <strong>Stripe Inc.</strong> — Zahlungsabwicklung. PCI DSS Level 1 zertifiziert.{" "}
            <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Datenschutzhinweise</a>
          </li>
          <li>
            <strong>Resend Inc.</strong> — Transaktions-E-Mails (Bestätigungen, Passwort-Reset).
          </li>
        </ul>
        <p>Mit allen Auftragsverarbeitern bestehen Verträge gemäß Art. 28 DSGVO bzw. EU-Standardvertragsklauseln.</p>
      </Section>

      <Section title="6. Speicherdauer">
        <p>
          Personenbezogene Daten werden für die Dauer des Vertragsverhältnisses gespeichert. Nach Vertragsende
          werden Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzlichen Aufbewahrungsfristen entgegenstehen:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>§ 257 HGB: 6 Jahre für Geschäftsbriefe</li>
          <li>§ 147 AO: 10 Jahre für Buchungsbelege und Rechnungen</li>
        </ul>
      </Section>

      <Section title="7. Ihre Rechte">
        <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Auskunft</strong> (Art. 15 DSGVO)</li>
          <li><strong>Berichtigung</strong> (Art. 16 DSGVO)</li>
          <li><strong>Löschung</strong> (Art. 17 DSGVO)</li>
          <li><strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)</li>
          <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
          <li><strong>Widerspruch</strong> (Art. 21 DSGVO)</li>
        </ul>
        <p>
          Anfragen richten Sie an{" "}
          <a href="mailto:kontakt@nomad-solutions.de" className="text-primary hover:underline">kontakt@nomad-solutions.de</a>.
        </p>
        <p>
          Sie haben zudem das Recht, sich bei einer Aufsichtsbehörde zu beschweren. Die für uns zuständige Behörde ist
          die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW).
        </p>
      </Section>

      <Section title="8. Cookies">
        <p>
          NomadWorks verwendet ausschließlich technisch notwendige Cookies für die Authentifizierung
          (Supabase Auth Session). Es werden keine Tracking-Cookies, Werbe-Cookies oder Analyse-Tools
          wie Google Analytics eingesetzt.
        </p>
      </Section>

      <Section title="9. SSL-Verschlüsselung">
        <p>
          Alle Seiten und API-Endpunkte nutzen eine 256-Bit TLS-Verschlüsselung.
          Eine verschlüsselte Verbindung erkennen Sie am Schloss-Symbol in der Adressleiste.
        </p>
      </Section>

      <Section title="10. Auftragsverarbeitung (AVV)">
        <p>
          NomadWorks-Kunden verarbeiten personenbezogene Daten ihrer Mitarbeiter (Name, Arbeitszeiten, Stundensätze)
          in unserer Software. Hierbei agieren wir als Auftragsverarbeiter gemäß Art. 28 DSGVO. Einen
          Auftragsverarbeitungsvertrag (AVV) stellen wir auf Anfrage bereit.
        </p>
      </Section>

      <Section title="11. Änderungen">
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung bei Änderungen des Dienstes oder der Rechtslage anzupassen.
          Die aktuelle Version finden Sie stets auf dieser Seite.
        </p>
      </Section>
    </article>
  )
}
