import type { Metadata } from "next"

export const metadata: Metadata = { title: "AGB — NomadWorks" }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

export default function AGBPage() {
  return (
    <article className="space-y-8 text-foreground/80 text-sm leading-relaxed">
      <h1 className="text-3xl font-semibold text-foreground">Allgemeine Geschäftsbedingungen (AGB)</h1>
      <p>Stand: April 2026</p>

      <Section title="§ 1 Geltungsbereich">
        <p>
          Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der SaaS-Plattform &quot;NomadWorks&quot;,
          betrieben von der Nomad Solutions UG (haftungsbeschränkt), Hochstr. 17, 47228 Duisburg
          (nachfolgend &quot;Anbieter&quot;). Abweichende Bedingungen des Kunden werden nicht anerkannt,
          es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
        </p>
      </Section>

      <Section title="§ 2 Vertragsgegenstand">
        <p>
          Der Anbieter stellt dem Kunden eine cloud-basierte ERP-Software für Bauunternehmen zur Verfügung.
          Die Software umfasst Module für Zeiterfassung, Baustellen-Management, Disposition, Mitarbeiterverwaltung,
          Fuhrpark, Lagerverwaltung, Rechnungswesen, Subunternehmerverwaltung und Bautagesberichte
          gemäß dem gewählten Tarif.
        </p>
      </Section>

      <Section title="§ 3 Registrierung und Konto">
        <p>
          Zur Nutzung ist eine Registrierung mit vollständigen und wahrheitsgemäßen Angaben erforderlich.
          Pro Unternehmen wird ein Hauptkonto (Geschäftsführer/Owner) angelegt, das weitere Benutzerkonten
          verwalten kann. Der Kunde ist für die Sicherheit seiner Zugangsdaten verantwortlich und muss
          mindestens 18 Jahre alt sein.
        </p>
      </Section>

      <Section title="§ 4 Testphase">
        <p>
          Neue Kunden erhalten eine kostenlose Testphase von 7 Tagen mit vollem Funktionsumfang (max. 5 Mitarbeiter).
          Nach Ablauf der Testphase wird der Zugang eingeschränkt, bis ein kostenpflichtiger Tarif gewählt wird.
          Es erfolgt keine automatische Umwandlung in einen Bezahltarif und keine Zahlungspflicht.
        </p>
      </Section>

      <Section title="§ 5 Preise und Zahlung">
        <p>Die Abrechnung erfolgt monatlich im Voraus über den Zahlungsdienstleister Stripe. Aktuelle Tarife:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Starter:</strong> 149,99 €/Monat (bis 10 Mitarbeiter)</li>
          <li><strong>Business:</strong> 249,99 €/Monat (bis 30 Mitarbeiter)</li>
          <li><strong>Enterprise:</strong> 499,99 €/Monat (bis 100 Mitarbeiter)</li>
        </ul>
        <p>
          Alle Preise verstehen sich als Nettopreise zuzüglich der gesetzlichen Umsatzsteuer.
          Akzeptierte Zahlungsmethoden: Kreditkarte und SEPA-Lastschrift.
          Preisänderungen werden mit einer Frist von 30 Tagen per E-Mail angekündigt.
        </p>
      </Section>

      <Section title="§ 6 Laufzeit und Kündigung">
        <p>
          Das Abonnement ist monatlich kündbar zum Ende des jeweiligen Abrechnungszeitraums. Die Kündigung
          kann über das Stripe-Kundenportal oder per E-Mail an{" "}
          <a href="mailto:kontakt@nomad-solutions.de" className="text-primary hover:underline">kontakt@nomad-solutions.de</a> erfolgen.
        </p>
        <p>
          Nach Kündigung werden alle Daten für 30 Tage aufbewahrt und können auf Wunsch exportiert werden.
          Danach werden sie unwiderruflich gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
        </p>
      </Section>

      <Section title="§ 7 Verfügbarkeit (SLA)">
        <p>
          Der Anbieter strebt eine Verfügbarkeit von 99,5 % im Monatsmittel an. Geplante Wartungsfenster
          werden mindestens 48 Stunden im Voraus per E-Mail angekündigt und finden bevorzugt außerhalb der
          Geschäftszeiten (Mo–Fr, 7–18 Uhr MEZ) statt.
        </p>
        <p>
          Von der Verfügbarkeitsgarantie ausgenommen sind: höhere Gewalt, Störungen bei Drittanbietern
          (Supabase, Vercel, Stripe) und angekündigte Wartungsfenster.
        </p>
      </Section>

      <Section title="§ 8 Datenschutz">
        <p>
          Der Anbieter verarbeitet personenbezogene Daten gemäß der{" "}
          <a href="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</a>.
          Für Kunden, die personenbezogene Daten ihrer Mitarbeiter in NomadWorks verarbeiten, wird ein
          Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO auf Anfrage bereitgestellt.
        </p>
      </Section>

      <Section title="§ 9 Haftung">
        <p>
          Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit. Bei leichter Fahrlässigkeit
          haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) und
          beschränkt auf den vorhersehbaren, vertragstypischen Schaden, maximal jedoch auf den Vertragswert
          der letzten 12 Monate.
        </p>
        <p>
          Eine Haftung für Datenverlust wird auf den typischen Wiederherstellungsaufwand beschränkt, der bei
          regelmäßiger und gefahrentsprechender Anfertigung von Sicherungskopien durch den Kunden entstanden wäre.
          Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.
        </p>
      </Section>

      <Section title="§ 10 Nutzungsrechte">
        <p>
          Der Kunde erhält für die Dauer des Vertragsverhältnisses ein einfaches, nicht übertragbares,
          nicht unterlizenzierbares Recht zur Nutzung der Software gemäß diesen AGB. Eine Weitergabe
          der Zugangsdaten an Dritte außerhalb des Unternehmens ist nicht gestattet.
        </p>
      </Section>

      <Section title="§ 11 Änderungen der AGB">
        <p>
          Der Anbieter kann diese AGB mit einer Ankündigungsfrist von mindestens 30 Tagen per E-Mail ändern.
          Widerspricht der Kunde nicht innerhalb von 30 Tagen nach Zugang der Änderungsmitteilung,
          gelten die geänderten Bedingungen als angenommen. Ein Widerspruch berechtigt beide Seiten zur
          außerordentlichen Kündigung. Der Anbieter wird den Kunden in der Änderungsmitteilung auf sein
          Widerspruchsrecht und die Bedeutung der Frist hinweisen.
        </p>
      </Section>

      <Section title="§ 12 Schlussbestimmungen">
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
          Gerichtsstand für Streitigkeiten ist Duisburg, sofern der Kunde Kaufmann, juristische Person
          des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.
        </p>
        <p>
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit
          der übrigen Bestimmungen unberührt. Anstelle der unwirksamen Bestimmung tritt eine Regelung,
          die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.
        </p>
      </Section>
    </article>
  )
}
