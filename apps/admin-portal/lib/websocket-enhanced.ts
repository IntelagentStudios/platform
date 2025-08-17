import { Server as HTTPServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from './db'
import { createAuditLog } from './audit'

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS'

interface AuthenticatedSocket extends Socket {
  userId?: string
  organizationId?: string
  teamIds?: string[]
}

export class WebSocketManager {
  private io: SocketServer
  private organizationRooms: Map<string, Set<string>> = new Map()
  private teamRooms: Map<string, Set<string>> = new Map()
  private userSockets: Map<string, Set<string>> = new Map()

  constructor(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true
      }
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Authentication required'))
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        
        // Simplified authentication - database models not yet implemented
        // In production, would verify user exists and is active
        socket.userId = decoded.userId || 'anonymous'
        socket.organizationId = decoded.organizationId
        socket.teamIds = decoded.teamIds || []

        next()
      } catch (error) {
        next(new Error('Authentication failed'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`)

      // Track user socket
      if (socket.userId) {
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set())
        }
        this.userSockets.get(socket.userId)?.add(socket.id)
      }

      // Join organization room
      if (socket.organizationId) {
        socket.join(`org:${socket.organizationId}`)
        if (!this.organizationRooms.has(socket.organizationId)) {
          this.organizationRooms.set(socket.organizationId, new Set())
        }
        this.organizationRooms.get(socket.organizationId)?.add(socket.id)
      }

      // Join team rooms
      socket.teamIds?.forEach(teamId => {
        socket.join(`team:${teamId}`)
        if (!this.teamRooms.has(teamId)) {
          this.teamRooms.set(teamId, new Set())
        }
        this.teamRooms.get(teamId)?.add(socket.id)
      })

      // Handle custom events
      socket.on('subscribe', (channel: string) => {
        if (this.canAccessChannel(socket, channel)) {
          socket.join(channel)
          socket.emit('subscribed', { channel })
        } else {
          socket.emit('error', { message: 'Access denied to channel' })
        }
      })

      socket.on('unsubscribe', (channel: string) => {
        socket.leave(channel)
        socket.emit('unsubscribed', { channel })
      })

      socket.on('broadcast', async (data: any) => {
        // Simplified broadcast - in production would validate permissions
        const { channel, message } = data
        if (this.canAccessChannel(socket, channel)) {
          this.io.to(channel).emit('message', {
            from: socket.userId,
            message,
            timestamp: new Date().toISOString()
          })
        }
      })

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`)
        
        // Clean up tracking
        if (socket.userId) {
          this.userSockets.get(socket.userId)?.delete(socket.id)
          if (this.userSockets.get(socket.userId)?.size === 0) {
            this.userSockets.delete(socket.userId)
          }
        }

        if (socket.organizationId) {
          this.organizationRooms.get(socket.organizationId)?.delete(socket.id)
        }

        socket.teamIds?.forEach(teamId => {
          this.teamRooms.get(teamId)?.delete(socket.id)
        })
      })
    })
  }

  private canAccessChannel(socket: AuthenticatedSocket, channel: string): boolean {
    // Simplified permission check
    if (channel.startsWith('org:')) {
      const orgId = channel.substring(4)
      return socket.organizationId === orgId
    }
    
    if (channel.startsWith('team:')) {
      const teamId = channel.substring(5)
      return socket.teamIds?.includes(teamId) || false
    }
    
    if (channel.startsWith('user:')) {
      const userId = channel.substring(5)
      return socket.userId === userId
    }
    
    // Public channels
    return true
  }

  // Public methods for sending messages
  sendToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId)
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data)
      })
    }
  }

  sendToOrganization(organizationId: string, event: string, data: any) {
    this.io.to(`org:${organizationId}`).emit(event, data)
  }

  sendToTeam(teamId: string, event: string, data: any) {
    this.io.to(`team:${teamId}`).emit(event, data)
  }

  broadcast(event: string, data: any) {
    this.io.emit(event, data)
  }

  getOnlineUsers(organizationId?: string): string[] {
    if (organizationId) {
      const sockets = this.organizationRooms.get(organizationId)
      const users: Set<string> = new Set()
      
      if (sockets) {
        sockets.forEach(socketId => {
          const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket
          if (socket?.userId) {
            users.add(socket.userId)
          }
        })
      }
      
      return Array.from(users)
    }
    
    return Array.from(this.userSockets.keys())
  }

  getOnlineCount(organizationId?: string): number {
    return this.getOnlineUsers(organizationId).length
  }

  disconnect() {
    this.io.close()
  }
}

// Export singleton instance
let wsManager: WebSocketManager | null = null

export function initWebSocket(server: HTTPServer): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(server)
  }
  return wsManager
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager
}