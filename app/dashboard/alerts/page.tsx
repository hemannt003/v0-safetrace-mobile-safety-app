import { AlertsList } from "@/components/dashboard/alerts-list"

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Active Alerts</h2>
        <p className="text-muted-foreground">Manage and respond to safety alerts</p>
      </div>

      <AlertsList showConnectionStatus />
    </div>
  )
}
