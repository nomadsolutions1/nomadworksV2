import { getSites } from "@/lib/actions/sites"
import { SiteMapPage } from "@/components/modules/sites/site-map-page"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Baustellen — Karte" }

export default async function BaustellenKartePage() {
  const { data: sites = [] } = await getSites()
  // Spread for serialization
  const serializedSites = sites.map((s) => ({ ...s }))

  return <SiteMapPage sites={serializedSites} />
}
