import { StatsCards } from "@/components/dashboard/stats-cards"
import { AlertsList } from "@/components/dashboard/alerts-list"
import { LiveMap } from "@/components/dashboard/live-map"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Overview</h2>
        <p className="text-muted-foreground">Monitor safety status in real-time</p>
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <AlertsList limit={5} />
        <LiveMap height="400px" />
      </div>
    </div>
  )
}
