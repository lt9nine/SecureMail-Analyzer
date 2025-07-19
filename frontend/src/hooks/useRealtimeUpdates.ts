import { useEffect, useRef, useState, useCallback } from 'react'
import { apiService } from '../services/api'

export interface EmailUpdate {
  type: 'new_email'
  timestamp: number
  email_count: number
  latest_email: {
    uid: string
    subject: string
    from_addr: string
    score: number
    risk_level: string
  }
}

export interface HeartbeatEvent {
  timestamp: number
  status: string
}

export interface ErrorEvent {
  error: string
  timestamp: number
}

export function useRealtimeUpdates() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<EmailUpdate | null>(null)
  const [lastHeartbeat, setLastHeartbeat] = useState<HeartbeatEvent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = apiService.createEventSource()
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('SSE Connection established')
        setIsConnected(true)
        setError(null)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('SSE Event received:', data)
        } catch (e) {
          console.error('Failed to parse SSE message:', e)
        }
      }

      eventSource.addEventListener('email_update', (event) => {
        try {
          const update: EmailUpdate = JSON.parse(event.data)
          setLastUpdate(update)
          console.log('New email update:', update)
        } catch (e) {
          console.error('Failed to parse email update:', e)
        }
      })

      eventSource.addEventListener('heartbeat', (event) => {
        try {
          const heartbeat: HeartbeatEvent = JSON.parse(event.data)
          setLastHeartbeat(heartbeat)
        } catch (e) {
          console.error('Failed to parse heartbeat:', e)
        }
      })

      eventSource.addEventListener('error', (event) => {
        try {
          const errorEvent = event as MessageEvent
          const errorData: ErrorEvent = JSON.parse(errorEvent.data)
          setError(errorData.error)
          console.error('SSE Error:', errorData.error)
        } catch (e) {
          setError('Connection error')
          console.error('SSE Connection error:', e)
        }
        setIsConnected(false)
      })

      eventSource.onerror = (event) => {
        console.error('SSE Connection failed:', event)
        setIsConnected(false)
        setError('Connection failed')
        
        // Auto-reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...')
          connect()
        }, 5000)
      }

    } catch (e) {
      console.error('Failed to create EventSource:', e)
      setError('Failed to establish connection')
      setIsConnected(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    lastUpdate,
    lastHeartbeat,
    error,
    connect,
    disconnect
  }
} 