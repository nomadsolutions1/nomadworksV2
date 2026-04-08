import Link from "next/link"
import { Building2 } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
      <div className="flex-1 flex items-center justify-center w-full">
        {children}
      </div>
      <footer className="py-4 text-center text-xs text-muted-foreground/70 space-x-3" aria-label="Rechtliche Links">
        <Link href="/impressum" className="hover:text-muted-foreground">Impressum</Link>
        <span aria-hidden="true">·</span>
        <Link href="/datenschutz" className="hover:text-muted-foreground">Datenschutz</Link>
        <span aria-hidden="true">·</span>
        <Link href="/agb" className="hover:text-muted-foreground">AGB</Link>
      </footer>
    </div>
  )
}
