import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'

export function useWebSocket(license_key?: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
    })

    socketInstance.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      
      if (license_key) {
        socketInstance.emit('join-room', license_key)
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    socketInstance.on('data-update', (data) => {
      setLastUpdate(new Date(data.timestamp))
    })

    setSocket(socketInstance)

    return () => {
      if (license_key) {
        socketInstance.emit('leave-room', license_key)
      }
      socketInstance.disconnect()
    }
  }, [license_key])

  return { socket, isConnected, lastUpdate }
}