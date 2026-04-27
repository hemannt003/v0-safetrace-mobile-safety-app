"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ConnectionStatus } from "@/hooks/use-realtime"
import { cn } from "@/lib/utils"

interface ConnectionIndicatorProps {
  status: ConnectionStatus
  lastUpdate: Date | null
  onReconnect: () => void
  className?: string
}

export function ConnectionIndicator({
  status,
  lastUpdate,
  onReconnect,
  className,
}: ConnectionIndicatorProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("")

  useEffect(() => {
    if (!lastUpdate) return

    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
      if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`)
      } else if (seconds < 3600) {
        setTimeSinceUpdate(`${Math.floor(seconds / 60)}m ago`)
      } else {
        setTimeSinceUpdate(`${Math.floor(seconds / 3600)}h ago`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [lastUpdate])

  const statusConfig = {
    connecting: {
      icon: RefreshCw,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      pulseColor: "bg-amber-500",
      label: "Connecting...",
      animate: true,
    },
    connected: {
      icon: Wifi,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      pulseColor: "bg-emerald-500",
      label: "Live",
      animate: false,
    },
    disconnected: {
      icon: WifiOff,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      pulseColor: "bg-destructive",
      label: "Disconnected",
      animate: false,
    },
    reconnecting: {
      icon: RefreshCw,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      pulseColor: "bg-amber-500",
      label: "Reconnecting...",
      animate: true,
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all",
              config.bgColor,
              className
            )}
          >
            <span className="relative flex h-2.5 w-2.5">
              {(status === "connected" || config.animate) && (
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full rounded-full opacity-75",
                    config.pulseColor,
                    config.animate ? "animate-ping" : "animate-pulse"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2.5 w-2.5 rounded-full",
                  config.pulseColor
                )}
              />
            </span>
            <Icon
              className={cn(
                "h-4 w-4",
                config.color,
                config.animate && "animate-spin"
              )}
            />
            <span className={cn("font-medium", config.color)}>
              {config.label}
            </span>
            {status === "disconnected" && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onReconnect()
                }}
              >
                Retry
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{config.label}</p>
            {lastUpdate && (
              <p className="text-muted-foreground">
                Last update: {timeSinceUpdate}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
