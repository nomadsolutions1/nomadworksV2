import type { Metadata } from "next"

export const metadata: Metadata = { title: "Impressum — NomadWorks" }

export default function ImpressumPage() {
  return (
    <article className="space-y-8 text-foreground/80 text-sm leading-relaxed">
      <h1 className="text-3xl font-semibold text-foreground">Impressum</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Angaben gemäß § 5 TMG</h2>
        <p>
          Nomad Solutions UG (haftungsbeschränkt)<br />
          Hochstr. 17<br />
          47228 Duisburg
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Vertreten durch</h2>
        <p>Mikail Sünger (Geschäftsführer)</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Kontakt</h2>
        <p>
          E-Mail: <a href="mailto:kontakt@nomad-solutions.de" className="text-primary hover:underline">kontakt@nomad-solutions.de</a><br />
          Website: <a href="https://nomadworks.vercel.app" className="text-primary hover:underline">https://nomadworks.vercel.app</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Registereintrag</h2>
        <p>Amtsgericht Duisburg, HRB 39988</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Umsatzsteuer-ID</h2>
        <p>USt-IdNr. gemäß § 27 a UStG: DE362027220</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>Mikail Sünger, Hochstr. 17, 47228 Duisburg</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            https://ec.europa.eu/consumers/odr/
          </a>
        </p>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen
          Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet,
          übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf
          eine rechtswidrige Tätigkeit hinweisen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
          Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten
          Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten
          wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum
          Zeitpunkt der Verlinkung nicht erkennbar.
        </p>
      </section>
    </article>
  )
}
