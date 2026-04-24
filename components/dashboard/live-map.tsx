"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import type { Alert } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Dynamically import map to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
)

interface LiveMapProps {
  className?: string
  height?: string
}

export function LiveMap({ className, height = "500px" }: LiveMapProps) {
  const [mounted, setMounted] = useState(false)
  const { data: alerts, isLoading } = useSWR<Alert[]>("/api/alerts", fetcher, {
    refreshInterval: 5000,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Default center (New York)
  const defaultCenter: [number, number] = [40.7128, -74.006]

  // Calculate center based on alerts
  const center: [number, number] = alerts && alerts.length > 0
    ? [alerts[0].latitude, alerts[0].longitude]
    : defaultCenter

  if (!mounted) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Live Map
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <Spinner className="h-8 w-8" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Live Map
          {alerts && alerts.filter((a) => a.status === "active").length > 0 && (
            <Badge variant="destructive">
              {alerts.filter((a) => a.status === "active").length} Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div style={{ height }} className="overflow-hidden rounded-b-lg">
            <link
              rel="stylesheet"
              href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
              integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
              crossOrigin=""
            />
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {alerts?.map((alert) => (
                <div key={alert.id}>
                  <Circle
                    center={[alert.latitude, alert.longitude]}
                    radius={200}
                    pathOptions={{
                      color: alert.status === "active" ? "#ef4444" : alert.status === "responding" ? "#f59e0b" : "#22c55e",
                      fillColor: alert.status === "active" ? "#ef4444" : alert.status === "responding" ? "#f59e0b" : "#22c55e",
                      fillOpacity: 0.2,
                    }}
                  />
                  <Marker position={[alert.latitude, alert.longitude]}>
                    <Popup>
                      <div className="min-w-48">
                        <p className="font-semibold">{alert.user?.full_name || "Unknown"}</p>
                        <p className="text-sm capitalize">{alert.alert_type} Alert</p>
                        <p className="text-sm text-muted-foreground">
                          Status: <span className="capitalize">{alert.status}</span>
                        </p>
                        {alert.address && (
                          <p className="mt-1 text-xs text-muted-foreground">{alert.address}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </div>
              ))}
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
