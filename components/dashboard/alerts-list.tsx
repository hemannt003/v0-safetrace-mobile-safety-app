"use client"

import { useCallback, useState, useTransition, memo } from "react"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertTriangle, MapPin, Phone, Clock, CheckCircle, Radio } from "lucide-react"
import type { Alert } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
import { useRealtime, type ConnectionStatus } from "@/hooks/use-realtime"
import { ConnectionIndicator } from "./connection-indicator"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AlertsListProps {
  limit?: number
  showActions?: boolean
  showConnectionStatus?: boolean
}

// Memoized alert item for better performance
const AlertItem = memo(function AlertItem({
  alert,
  showActions,
  onRespond,
  onResolve,
  isPending,
}: {
  alert: Alert
  showActions: boolean
  onRespond: (id: string) => void
  onResolve: (id: string) => void
  isPending: boolean
}) {
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "sos":
        return <AlertTriangle className="h-4 w-4" />
      case "shake":
        return <Radio className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "destructive"
      case "responding":
        return "default"
      case "resolved":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4 transition-all sm:flex-row sm:items-start sm:justify-between",
        alert.status === "active" && "animate-pulse-subtle border-destructive/50",
        isPending && "opacity-70"
      )}
    >
      <div className="flex gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={alert.user?.profile_image_url || undefined} />
          <AvatarFallback className="bg-destructive text-destructive-foreground">
            {alert.user?.full_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {alert.user?.full_name || "Unknown User"}
            </span>
            <Badge variant={getStatusColor(alert.status)}>
              {getAlertTypeIcon(alert.alert_type)}
              <span className="ml-1 capitalize">{alert.alert_type}</span>
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {alert.address || `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {alert.user?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {alert.user.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
      {showActions && (
        <div className="flex gap-2">
          {alert.status === "active" && (
            <Button
              size="sm"
              onClick={() => onRespond(alert.id)}
              disabled={isPending}
            >
              {isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Respond
            </Button>
          )}
          {alert.status === "responding" && (
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
              onClick={() => onResolve(alert.id)}
              disabled={isPending}
            >
              {isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Resolve
            </Button>
          )}
        </div>
      )}
    </div>
  )
})

export function AlertsList({
  limit,
  showActions = true,
  showConnectionStatus = false,
}: AlertsListProps) {
  const [pendingAlertId, setPendingAlertId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { data: alerts, isLoading, mutate } = useSWR<Alert[]>(
    "/api/alerts?status=active",
    fetcher,
    {
      refreshInterval: 0, // Disable polling, rely on realtime
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  )

  // Real-time subscription
  const { status, lastUpdate, reconnect } = useRealtime<Alert>({
    table: "alerts",
    onInsert: useCallback(() => {
      mutate()
    }, [mutate]),
    onUpdate: useCallback(() => {
      mutate()
    }, [mutate]),
    onDelete: useCallback(() => {
      mutate()
    }, [mutate]),
  })

  const handleRespond = useCallback(async (alertId: string) => {
    setPendingAlertId(alertId)

    // Optimistic update
    const optimisticData = alerts?.map((a) =>
      a.id === alertId ? { ...a, status: "responding" as const } : a
    )

    startTransition(async () => {
      try {
        await mutate(
          async () => {
            await fetch(`/api/alerts/${alertId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "responding" }),
            })
            return optimisticData
          },
          {
            optimisticData,
            rollbackOnError: true,
            revalidate: true,
          }
        )
      } finally {
        setPendingAlertId(null)
      }
    })
  }, [alerts, mutate])

  const handleResolve = useCallback(async (alertId: string) => {
    setPendingAlertId(alertId)

    // Optimistic update - remove from list since resolved alerts are filtered out
    const optimisticData = alerts?.filter((a) => a.id !== alertId)

    startTransition(async () => {
      try {
        await mutate(
          async () => {
            await fetch(`/api/alerts/${alertId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "resolved" }),
            })
            return optimisticData
          },
          {
            optimisticData,
            rollbackOnError: true,
            revalidate: true,
          }
        )
      } finally {
        setPendingAlertId(null)
      }
    })
  }, [alerts, mutate])

  const displayAlerts = limit ? alerts?.slice(0, limit) : alerts

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Active Alerts
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
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Active Alerts
            {displayAlerts && displayAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {displayAlerts.length}
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
        {!displayAlerts || displayAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="mb-2 h-12 w-12 text-emerald-500" />
            <p className="text-muted-foreground">No active alerts</p>
            <p className="text-sm text-muted-foreground">All users are safe</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                showActions={showActions}
                onRespond={handleRespond}
                onResolve={handleResolve}
                isPending={pendingAlertId === alert.id && isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
