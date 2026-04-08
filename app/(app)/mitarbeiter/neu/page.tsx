import { EmployeeNew } from "@/components/modules/employees/employee-new"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Mitarbeiter hinzufügen" }

export default function NeueMitarbeiterPage() {
  return <EmployeeNew />
}
