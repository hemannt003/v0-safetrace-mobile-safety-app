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
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const supabaseRef = useRef(createClient())
  
  // Store callbacks in refs to avoid re-subscriptions when callbacks change
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  const onDeleteRef = useRef(onDelete)
  
  // Keep refs in sync with latest callbacks
  useEffect(() => {
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
    onDeleteRef.current = onDelete
  }, [onInsert, onUpdate, onDelete])

  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      cleanup()
      return
    }

    // Cleanup any existing channel before creating new one
    cleanup()
    setStatus("connecting")

    const supabase = supabaseRef.current
    const channelName = `realtime-${table}-${filter || "all"}`

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

    // Create channel, attach ALL listeners, THEN subscribe
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        channelConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          setLastUpdate(new Date())
          reconnectAttemptsRef.current = 0

          // Use refs to get latest callbacks without causing re-subscriptions
          if (payload.eventType === "INSERT" && onInsertRef.current) {
            onInsertRef.current(payload.new as T)
          } else if (payload.eventType === "UPDATE" && onUpdateRef.current) {
            onUpdateRef.current(payload.new as T)
          } else if (payload.eventType === "DELETE" && onDeleteRef.current) {
            onDeleteRef.current({ old: payload.old as T })
          }
        }
      )
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === "SUBSCRIBED") {
          setStatus("connected")
          reconnectAttemptsRef.current = 0
        } else if (subscriptionStatus === "CLOSED" || subscriptionStatus === "CHANNEL_ERROR") {
          setStatus("disconnected")
          // Schedule reconnect with exponential backoff
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
            reconnectAttemptsRef.current += 1
            setStatus("reconnecting")
            reconnectTimeoutRef.current = setTimeout(() => {
              // Trigger reconnect by re-running effect
              cleanup()
              setStatus("connecting")
            }, delay)
          }
        } else if (subscriptionStatus === "TIMED_OUT") {
          setStatus("reconnecting")
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
            reconnectAttemptsRef.current += 1
            reconnectTimeoutRef.current = setTimeout(() => {
              cleanup()
              setStatus("connecting")
            }, delay)
          } else {
            setStatus("disconnected")
          }
        }
      })

    channelRef.current = channel

    return cleanup
  }, [enabled, table, schema, filter, event, cleanup])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    cleanup()
    setStatus("connecting")
  }, [cleanup])

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
  const supabaseRef = useRef(createClient())
  
  // Store callback in ref to avoid re-subscriptions when callback changes
  const onUpdateRef = useRef(onUpdate)
  
  // Keep ref in sync with latest callback
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  // Stable stringified tables config to detect actual changes
  const tablesKey = JSON.stringify(tables)

  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      cleanup()
      return
    }

    // Cleanup any existing channel before creating new one
    cleanup()
    setStatus("connecting")

    const supabase = supabaseRef.current
    // Use stable channel name based on tables config
    const channelName = `multi-realtime-${tablesKey.slice(0, 50)}`

    // Create channel first
    let channel = supabase.channel(channelName)

    // Attach ALL listeners before subscribing
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
        // Use ref to get latest callback without causing re-subscriptions
        onUpdateRef.current()
      })
    })

    // THEN subscribe after all listeners are attached
    channel.subscribe((subscriptionStatus) => {
      if (subscriptionStatus === "SUBSCRIBED") {
        setStatus("connected")
        reconnectAttemptsRef.current = 0
      } else if (subscriptionStatus === "CLOSED" || subscriptionStatus === "CHANNEL_ERROR") {
        setStatus("disconnected")
        // Schedule reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
          reconnectAttemptsRef.current += 1
          setStatus("reconnecting")
          reconnectTimeoutRef.current = setTimeout(() => {
            cleanup()
            setStatus("connecting")
          }, delay)
        }
      } else if (subscriptionStatus === "TIMED_OUT") {
        setStatus("reconnecting")
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
          reconnectAttemptsRef.current += 1
          reconnectTimeoutRef.current = setTimeout(() => {
            cleanup()
            setStatus("connecting")
          }, delay)
        } else {
          setStatus("disconnected")
        }
      }
    })

    channelRef.current = channel

    return cleanup
  }, [enabled, tablesKey, cleanup])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    cleanup()
    setStatus("connecting")
  }, [cleanup])

  return { status, lastUpdate, reconnect }
}
