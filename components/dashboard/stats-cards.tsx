"use client"

import { useCallback, memo } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Users, Navigation, CheckCircle } from "lucide-react"
import type { DashboardStats } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
import { useMultiRealtime } from "@/hooks/use-realtime"
import { cn } from "@/lib/utils"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Failed to fetch")
  return json
}

// Memoized stat card for performance
const StatCard = memo(function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  isLoading,
  hasUpdate,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  isLoading: boolean
  hasUpdate: boolean
}) {
  return (
    <Card
      className={cn(
        "transition-all duration-300",
        hasUpdate && "ring-2 ring-primary/20"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-lg p-2 ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Spinner className="h-6 w-6" />
        ) : (
          <p
            className={cn(
              "text-3xl font-bold text-foreground transition-transform",
              hasUpdate && "scale-105"
            )}
          >
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  )
})

export function StatsCards() {
  const { data: stats, isLoading, mutate } = useSWR<DashboardStats>(
    "/api/stats",
    fetcher,
    {
      refreshInterval: 0, // Rely on realtime
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  )

  // Subscribe to multiple tables for real-time stats updates
  const { status } = useMultiRealtime({
    tables: [
      { table: "alerts" },
      { table: "users" },
      { table: "journeys" },
    ],
    onUpdate: useCallback(() => {
      mutate()
    }, [mutate]),
  })

  const hasRecentUpdate = status === "connected"

  const cards = [
    {
      title: "Active Alerts",
      value: stats?.activeAlerts || 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Journeys",
      value: stats?.activeJourneys || 0,
      icon: Navigation,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Resolved Today",
      value: stats?.resolvedToday || 0,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          bgColor={card.bgColor}
          isLoading={isLoading}
          hasUpdate={hasRecentUpdate}
        />
      ))}
    </div>
  )
}
