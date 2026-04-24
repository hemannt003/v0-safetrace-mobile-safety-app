"use client"

import useSWR from "swr"
import { formatDistanceToNow, format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Navigation, Clock, MapPin, CheckCircle } from "lucide-react"
import type { Journey } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function JourneysList() {
  const { data: journeys, isLoading } = useSWR<Journey[]>(
    "/api/journeys?status=active",
    fetcher,
    { refreshInterval: 10000 }
  )

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
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-amber-500" />
          Active Journeys
          {journeys && journeys.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {journeys.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!journeys || journeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No active journeys</p>
          </div>
        ) : (
          <div className="space-y-4">
            {journeys.map((journey) => (
              <div
                key={journey.id}
                className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between"
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
