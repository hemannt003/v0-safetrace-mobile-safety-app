"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Users, Navigation, CheckCircle } from "lucide-react"
import type { DashboardStats } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function StatsCards() {
  const { data: stats, isLoading } = useSWR<DashboardStats>("/api/stats", fetcher, {
    refreshInterval: 5000,
  })

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
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner className="h-6 w-6" />
            ) : (
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
