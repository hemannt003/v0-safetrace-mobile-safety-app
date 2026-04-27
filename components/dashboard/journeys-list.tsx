"use client"

import { useCallback, memo } from "react"
import useSWR from "swr"
import { formatDistanceToNow, format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Navigation, Clock, MapPin, CheckCircle } from "lucide-react"
import type { Journey } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
import { useRealtime } from "@/hooks/use-realtime"
import { ConnectionIndicator } from "./connection-indicator"
import { cn } from "@/lib/utils"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Failed to fetch")
  return json
}

// Memoized journey item
const JourneyItem = memo(function JourneyItem({ journey }: { journey: Journey }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "alert_triggered":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4 transition-all sm:flex-row sm:items-start sm:justify-between",
        journey.status === "alert_triggered" && "border-destructive/50"
      )}
    >
      <div className="flex gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={journey.user?.profile_image_url || undefined} />
          <AvatarFallback className="bg-amber-500 text-white">
            {journey.user?.full_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {journey.user?.full_name || "Unknown User"}
            </span>
            <Badge variant={getStatusColor(journey.status)}>
              <span className="capitalize">{journey.status.replace("_", " ")}</span>
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{journey.destination_name}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {journey.expected_arrival && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                ETA: {format(new Date(journey.expected_arrival), "h:mm a")}
              </span>
            )}
            <span>
              Started {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
            </span>
          </div>
          {journey.last_check_in && (
            <p className="text-xs text-muted-foreground">
              Last check-in: {formatDistanceToNow(new Date(journey.last_check_in), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
})

interface JourneysListProps {
  showConnectionStatus?: boolean
}

export function JourneysList({ showConnectionStatus = false }: JourneysListProps) {
  const { data: journeys, isLoading, mutate } = useSWR<Journey[]>(
    "/api/journeys?status=active",
    fetcher,
    {
      refreshInterval: 0, // Rely on realtime
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  )

  // Real-time subscription
  const { status, lastUpdate, reconnect } = useRealtime<Journey>({
    table: "journeys",
    onInsert: useCallback(() => mutate(), [mutate]),
    onUpdate: useCallback(() => mutate(), [mutate]),
    onDelete: useCallback(() => mutate(), [mutate]),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-amber-500" />
            Active Journeys
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-amber-500" />
            Active Journeys
            {journeys && journeys.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {journeys.length}
              </Badge>
            )}
          </CardTitle>
          {showConnectionStatus && (
            <ConnectionIndicator
              status={status}
              lastUpdate={lastUpdate}
              onReconnect={reconnect}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!journeys || !Array.isArray(journeys) || journeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No active journeys</p>
          </div>
        ) : (
          <div className="space-y-4">
            {journeys.map((journey) => (
              <JourneyItem key={journey.id} journey={journey} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
