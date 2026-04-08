import { EmployeeNew } from "@/components/modules/employees/employee-new"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Mitarbeiter hinzufuegen" }

export default function NeueMitarbeiterPage() {
  return <EmployeeNew />
}
