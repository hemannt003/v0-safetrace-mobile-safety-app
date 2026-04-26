"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting"

interface UseRealtimeOptions<T> {
  table: string
  schema?: string
  filter?: string
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  onInsert?: (payload: T) => void
  onUpdate?: (payload: T) => void
  onDelete?: (payload: { old: T }) => void
  enabled?: boolean
}

interface UseRealtimeReturn {
  status: ConnectionStatus
  lastUpdate: Date | null
  reconnect: () => void
}

export function useRealtime<T = Record<string, unknown>>({
  table,
  schema = "public",
  filter,
  event = "*",
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeOptions<T>): UseRealtimeReturn {
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  const onDeleteRef = useRef(onDelete)

  useEffect(() => {
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
    onDeleteRef.current = onDelete
  }, [onInsert, onUpdate, onDelete])

  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (channelRef.current) {
      const supabase = createClient()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!enabled || channelRef.current) return;


    setStatus("connecting")

    const supabase = createClient()
    const channelName = `realtime-${table}`

    const channelConfig: {
      event: "INSERT" | "UPDATE" | "DELETE" | "*"
      schema: string
      table: string
      filter?: string
    } = {
      event,
      schema,
      table,
    }

    if (filter) {
      channelConfig.filter = filter
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        channelConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          setLastUpdate(new Date())
          reconnectAttemptsRef.current = 0

          if (payload.eventType === "INSERT" && onInsertRef.current) {
            onInsertRef.current(payload.new as T)
          } else if (payload.eventType === "UPDATE" && onUpdateRef.current) {
            onUpdateRef.current(payload.new as T)
          } else if (payload.eventType === "DELETE" && onDeleteRef.current) {
            onDeleteRef.current({ old: payload.old as T })
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setStatus("connected")
          reconnectAttemptsRef.current = 0
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setStatus("disconnected")
          scheduleReconnect()
        } else if (status === "TIMED_OUT") {
          setStatus("reconnecting")
          scheduleReconnect()
        }
      })

    channelRef.current = channel
  }, [enabled, table, schema, filter, event])

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setStatus("disconnected")
      return
    }

    const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
    reconnectAttemptsRef.current += 1
    setStatus("reconnecting")

    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, delay)
  }, [connect])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    connect()
    return cleanup
  }, [connect, cleanup])

  return { status, lastUpdate, reconnect }
}

// Hook for subscribing to multiple tables
interface UseMultiRealtimeOptions {
  tables: Array<{
    table: string
    event?: "INSERT" | "UPDATE" | "DELETE" | "*"
    filter?: string
  }>
  onUpdate: () => void
  enabled?: boolean
}

export function useMultiRealtime({
  tables,
  onUpdate,
  enabled = true,
}: UseMultiRealtimeOptions): UseRealtimeReturn {
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (channelRef.current) {
      const supabase = createClient()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!enabled || channelRef.current) return;


    setStatus("connecting")

    const supabase = createClient()
    const channelName = `multi-realtime`

    let channel = supabase.channel(channelName)

    tables.forEach(({ table, event = "*", filter }) => {
      const config: {
        event: "INSERT" | "UPDATE" | "DELETE" | "*"
        schema: string
        table: string
        filter?: string
      } = {
        event,
        schema: "public",
        table,
      }
      if (filter) {
        config.filter = filter
      }

      channel = channel.on("postgres_changes", config, () => {
        setLastUpdate(new Date())
        reconnectAttemptsRef.current = 0
        onUpdate()
      })
    })

    channel.subscribe((subscriptionStatus) => {
      if (subscriptionStatus === "SUBSCRIBED") {
        setStatus("connected")
        reconnectAttemptsRef.current = 0
      } else if (subscriptionStatus === "CLOSED" || subscriptionStatus === "CHANNEL_ERROR") {
        setStatus("disconnected")
        scheduleReconnect()
      }
    })

    channelRef.current = channel
  }, [enabled, tables, onUpdate])

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= 5) {
      setStatus("disconnected")
      return
    }

    const delay = 1000 * Math.pow(2, reconnectAttemptsRef.current)
    reconnectAttemptsRef.current += 1
    setStatus("reconnecting")

    reconnectTimeoutRef.current = setTimeout(connect, delay)
  }, [connect])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    connect()
    return cleanup
  }, [connect, cleanup])

  return { status, lastUpdate, reconnect }
}
