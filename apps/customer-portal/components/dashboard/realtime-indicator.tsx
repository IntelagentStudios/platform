'use client'

import { useEffect, useState } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'

export default function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const { isRealtime } = useDashboardStore()

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/health')
      setIsConnected(response.ok)
    } catch {
      setIsConnected(false)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    if (!isRealtime) {
      setIsConnected(false)
      return
    }
    // Check connection once on mount
    checkConnection()
  }, [isRealtime])

  if (!isRealtime) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={checkConnection}
        disabled={isChecking}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Check connection"
      >
        <RefreshCw 
          className={`h-3 w-3 text-gray-500 ${isChecking ? 'animate-spin' : ''}`}
        />
      </button>
      <Activity 
        className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} 
      />
      <span className="text-sm text-muted-foreground">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  )
}