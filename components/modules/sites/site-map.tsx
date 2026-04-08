"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Site } from "@/lib/actions/sites"

// Fix default Leaflet marker icons — bundled locally instead of CDN
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  })
}

const greenIcon = new L.Icon({
  iconUrl: "/leaflet/marker-icon-2x-green.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const orangeIcon = new L.Icon({
  iconUrl: "/leaflet/marker-icon-2x-orange.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface SiteMapProps {
  sites: Site[]
}

export default function SiteMap({ sites }: SiteMapProps) {
  useEffect(() => { fixLeafletIcons() }, [])

  const sitesWithCoords = sites.filter((s) => s.latitude != null && s.longitude != null)
  const defaultCenter: [number, number] = [51.1657, 10.4515]
  const center: [number, number] = sitesWithCoords.length > 0 ? [sitesWithCoords[0].latitude!, sitesWithCoords[0].longitude!] : defaultCenter
  const zoom = sitesWithCoords.length > 0 ? 10 : 6

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%", borderRadius: "1rem" }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {sitesWithCoords.map((site) => (
        <Marker key={site.id} position={[site.latitude!, site.longitude!]} icon={site.status === "active" ? greenIcon : orangeIcon}>
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-semibold text-foreground mb-1">{site.name}</p>
              {site.address && <p className="text-xs text-muted-foreground mb-2">{site.address}</p>}
              <a href={`/baustellen/${site.id}`} className="text-xs text-primary font-medium hover:underline">Details ansehen</a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
