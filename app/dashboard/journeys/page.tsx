import { JourneysList } from "@/components/dashboard/journeys-list"

export default function JourneysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Active Journeys</h2>
        <p className="text-muted-foreground">Monitor ongoing trips and check-ins</p>
      </div>

      <JourneysList showConnectionStatus />
    </div>
  )
}
