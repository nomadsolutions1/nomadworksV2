import { redirect } from "next/navigation"

// Materialien-Liste lebt auf /lager im Tab "Materialien"
export default function MaterialienIndex() {
  redirect("/lager")
}
