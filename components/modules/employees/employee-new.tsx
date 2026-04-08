"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { EmployeeForm } from "@/components/modules/employees/employee-form"

export function EmployeeNew() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Mitarbeiter", href: "/mitarbeiter" },
          { label: "Neu anlegen" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold font-heading text-foreground">
          Mitarbeiter hinzufuegen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Legen Sie einen neuen Mitarbeiter an — mit oder ohne App-Zugang.
        </p>
      </div>
      <EmployeeForm mode="create" />
    </div>
  )
}
