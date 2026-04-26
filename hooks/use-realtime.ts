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

  // Use refs for callbacks to ensure we always have the latest closures without re-subscribing
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete })
  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete }
  }, [onInsert, onUpdate, onDelete])

  const connect = useCallback(() => {
    if (!enabled || channelRef.current) return;


    const supabase = createClient()
    // Consistent channel name based on configuration
    const channelName = `realtime-${schema}-${table}${filter ? `-${filter}` : ''}`
    
    // Prevent multiple subscriptions on re-render by reusing existing channel
    let channel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)

    if (channel) {
      console.log(`[useRealtime] Reusing existing channel: ${channelName}`)
      channelRef.current = channel
      if (channel.state === 'joined') {
        setStatus("connected")
      }
      return
    }

    setStatus("connecting")

    const channelConfig: {
      event: "INSERT" | "UPDATE" | "DELETE" | "*"
      schema: string
      table: string
      filter?: string
    } = { event, schema, table }

    if (filter) {
      channelConfig.filter = filter
    }

    // Correct pattern: .channel().on().subscribe()
    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        channelConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          setLastUpdate(new Date())
          reconnectAttemptsRef.current = 0

          const { onInsert: cbInsert, onUpdate: cbUpdate, onDelete: cbDelete } = callbacksRef.current

          if (payload.eventType === "INSERT" && cbInsert) {
            cbInsert(payload.new as T)
          } else if (payload.eventType === "UPDATE" && cbUpdate) {
            cbUpdate(payload.new as T)
          } else if (payload.eventType === "DELETE" && cbDelete) {
            cbDelete({ old: payload.old as T })
          }
        }
      )
      
    // .subscribe() MUST always be the LAST method in the chain
    channel.subscribe((subscribeStatus) => {
      if (subscribeStatus === "SUBSCRIBED") {
        setStatus("connected")
        reconnectAttemptsRef.current = 0
      } else if (subscribeStatus === "CLOSED" || subscribeStatus === "CHANNEL_ERROR") {
        setStatus("disconnected")
        scheduleReconnect()
      } else if (subscribeStatus === "TIMED_OUT") {
        setStatus("reconnecting")
        scheduleReconnect()
      }
    })

    channelRef.current = channel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, table, schema, filter, event])

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setStatus("disconnected")
      return
    }

    const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
    reconnectAttemptsRef.current += 1
    setStatus("reconnecting")

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, delay)
  }, [connect])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    if (channelRef.current) {
      const supabase = createClient()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    connect()
  }, [connect])

  // Single useEffect for realtime logic
  useEffect(() => {
    connect()
    
    // Proper cleanup in the return function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [connect])

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

  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  // Create a stable string representation to avoid unnecessary re-connects
  const tablesKey = JSON.stringify(tables)

  const connect = useCallback(() => {
    if (!enabled || channelRef.current) return;


    const supabase = createClient()
    
    // Create a deterministic hash for the channel name based on the tables config
    let hash = 0
    for (let i = 0; i < tablesKey.length; i++) {
      hash = Math.imul(31, hash) + tablesKey.charCodeAt(i) | 0
    }
    const channelName = `multi-realtime-${Math.abs(hash)}`
    
    // Reuse existing channel
    let channel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)

    if (channel) {
      console.log(`[useMultiRealtime] Reusing existing channel: ${channelName}`)
      channelRef.current = channel
      if (channel.state === 'joined') {
        setStatus("connected")
      }
      return
    }

    setStatus("connecting")

    const parsedTables = JSON.parse(tablesKey) as UseMultiRealtimeOptions['tables']
    let newChannel = supabase.channel(channelName)

    // Ensure all .on() listeners are attached BEFORE calling .subscribe()
    parsedTables.forEach(({ table, event = "*", filter }) => {
      const config: any = { event, schema: "public", table }
      if (filter) config.filter = filter

      newChannel = newChannel.on("postgres_changes", config, () => {
        setLastUpdate(new Date())
        reconnectAttemptsRef.current = 0
        onUpdateRef.current()
      })
    })

    // .subscribe() must ALWAYS be the LAST method in the chain
    newChannel.subscribe((subscribeStatus) => {
      if (subscribeStatus === "SUBSCRIBED") {
        setStatus("connected")
        reconnectAttemptsRef.current = 0
      } else if (subscribeStatus === "CLOSED" || subscribeStatus === "CHANNEL_ERROR") {
        setStatus("disconnected")
        scheduleReconnect()
      }
    })

    channelRef.current = newChannel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tablesKey])

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= 5) {
      setStatus("disconnected")
      return
    }

    const delay = 1000 * Math.pow(2, reconnectAttemptsRef.current)
    reconnectAttemptsRef.current += 1
    setStatus("reconnecting")

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    reconnectTimeoutRef.current = setTimeout(connect, delay)
  }, [connect])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    if (channelRef.current) {
      const supabase = createClient()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    connect()
  }, [connect])

  // Single useEffect for multi realtime logic
  useEffect(() => {
    connect()
    
    // Proper cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [connect])

  return { status, lastUpdate, reconnect }
}
