"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface EmployeeFormAccountSectionProps {
  withAccount: boolean
  setWithAccount: (v: boolean) => void
}

export function EmployeeFormAccountSection({ withAccount, setWithAccount }: EmployeeFormAccountSectionProps) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <Checkbox
            id="with_account"
            checked={withAccount}
            onCheckedChange={(checked) => setWithAccount(checked === true)}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="with_account" className="cursor-pointer font-medium">
              Mit Account einladen
            </Label>
            <p className="text-xs text-muted-foreground">
              Sendet dem Mitarbeiter einen Einladungslink per E-Mail.
            </p>
          </div>
        </div>

        {withAccount && (
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail-Adresse *</Label>
              <Input id="email" name="email" type="email" placeholder="mitarbeiter@firma.de" className="h-11 rounded-xl" required={withAccount} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Initiales Passwort *</Label>
              <Input id="password" name="password" type="password" placeholder="Mindestens 8 Zeichen" className="h-11 rounded-xl" required={withAccount} minLength={8} />
              <p className="text-xs text-muted-foreground">
                Teilen Sie dem Mitarbeiter dieses Passwort mit. Er kann es spaeter selbst aendern.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
