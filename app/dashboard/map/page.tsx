import { LiveMap } from "@/components/dashboard/live-map"

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Live Map</h2>
        <p className="text-muted-foreground">Track user locations and alerts in real-time</p>
      </div>

      <LiveMap height="calc(100vh - 220px)" />
    </div>
  )
}
