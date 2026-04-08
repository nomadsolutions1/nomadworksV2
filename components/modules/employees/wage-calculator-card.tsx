import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/format"
import { AG_ANTEIL_PROZENT } from "@/lib/utils/constants"
import { Briefcase } from "lucide-react"

interface WageCalculatorCardProps {
  hourlyRate: number | null
  monthlySalary: number | null
}

export function WageCalculatorCard({ hourlyRate, monthlySalary }: WageCalculatorCardProps) {
  if (!hourlyRate && !monthlySalary) return null

  const hourlyTotal = hourlyRate ? hourlyRate * (1 + AG_ANTEIL_PROZENT) : null
  const monthlyTotal = monthlySalary ? monthlySalary * (1 + AG_ANTEIL_PROZENT) : null
  const effectiveHourlyRate = monthlyTotal ? monthlyTotal / 169 : null

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          Geschaetzte Personalkosten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hourlyRate && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bruttostundenlohn</span>
            <span className="font-medium">{formatCurrency(hourlyRate)}</span>
          </div>
        )}
        {hourlyTotal && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">AG-Kosten / Stunde (+22,5%)</span>
            <span className="font-semibold text-primary">{formatCurrency(hourlyTotal)}</span>
          </div>
        )}
        {monthlySalary && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bruttomonatsgehalt</span>
            <span className="font-medium">{formatCurrency(monthlySalary)}</span>
          </div>
        )}
        {monthlyTotal && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">AG-Kosten / Monat (+22,5%)</span>
            <span className="font-semibold text-primary">{formatCurrency(monthlyTotal)}</span>
          </div>
        )}
        {effectiveHourlyRate && (
          <div className="border-t border-border pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Effektiver Stundensatz (169h/Monat)</span>
              <span className="font-semibold text-foreground">{formatCurrency(effectiveHourlyRate)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
