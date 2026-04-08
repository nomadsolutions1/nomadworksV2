import { Building2 } from "lucide-react"
import Link from "next/link"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background" aria-label="Legal-Header">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2" aria-label="NomadWorks Startseite">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">NomadWorks</span>
          </Link>
          <nav className="flex gap-4 text-sm" aria-label="Legal-Navigation">
            <Link href="/impressum" className="text-muted-foreground hover:text-primary">Impressum</Link>
            <Link href="/datenschutz" className="text-muted-foreground hover:text-primary">Datenschutz</Link>
            <Link href="/agb" className="text-muted-foreground hover:text-primary">AGB</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10" aria-label="Rechtlicher Inhalt">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground/70">
        <Link href="/login" className="text-primary hover:underline">Zurueck zur App</Link>
      </footer>
    </div>
  )
}
