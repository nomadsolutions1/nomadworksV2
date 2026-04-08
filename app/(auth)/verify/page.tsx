import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MailCheck, Building2 } from "lucide-react"
import Link from "next/link"

export default function VerifyPage() {
  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-foreground font-heading">
          NomadWorks
        </span>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold font-heading">
            E-Mail bestätigen
          </CardTitle>
          <CardDescription>
            Wir haben Ihnen eine Bestätigungs-E-Mail geschickt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Bitte klicken Sie auf den Link in der E-Mail um Ihr Konto zu aktivieren.
            Prüfen Sie auch Ihren Spam-Ordner.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            Zurück zum Login
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
