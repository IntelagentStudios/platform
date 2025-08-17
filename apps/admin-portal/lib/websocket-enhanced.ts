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
        
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            organization: true,
            teamMemberships: {
              include: {
                team: true
              }
            }
          }
        })

        if (!user || user.status !== 'active') {
          return next(new Error('Invalid user'))
        }

        socket.userId = user.id
        socket.organizationId = user.organizationId || undefined
        socket.teamIds = user.teamMemberships.map(tm => tm.teamId)

        next()
      } catch (error) {
        next(new Error('Authentication failed'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`)

      // Join organization room
      if (socket.organizationId) {
        socket.join(`org:${socket.organizationId}`)
        this.addToOrganizationRoom(socket.organizationId, socket.id)
      }

      // Join team rooms
      if (socket.teamIds) {
        socket.teamIds.forEach(teamId => {
          socket.join(`team:${teamId}`)
          this.addToTeamRoom(teamId, socket.id)
        })
      }

      // Join personal room
      if (socket.userId) {
        socket.join(`user:${socket.userId}`)
        this.addUserSocket(socket.userId, socket.id)
      }

      // Handle events
      this.handleActivityEvents(socket)
      this.handleCollaborationEvents(socket)
      this.handleNotificationEvents(socket)
      this.handlePresenceEvents(socket)

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`)
        this.handleDisconnect(socket)
      })
    })
  }

  private handleActivityEvents(socket: AuthenticatedSocket) {
    // Track activity
    socket.on('activity:track', async (data) => {
      if (!socket.userId || !socket.organizationId) return

      try {
        const activity = await prisma.activity.create({
          data: {
            userId: socket.userId,
            type: data.type,
            action: data.action,
            target: data.target,
            targetId: data.targetId,
            projectId: data.projectId,
            metadata: data.metadata
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        })

        // Broadcast to organization
        this.io.to(`org:${socket.organizationId}`).emit('activity:new', activity)
      } catch (error) {
        socket.emit('error', { message: 'Failed to track activity' })
      }
    })

    // Get activity feed
    socket.on('activity:subscribe', async (data) => {
      if (!socket.organizationId) return

      try {
        const activities = await prisma.activity.findMany({
          where: {
            user: {
              organizationId: socket.organizationId
            },
            ...(data.projectId && { projectId: data.projectId }),
            ...(data.teamId && {
              project: {
                teamId: data.teamId
              }
            })
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        })

        socket.emit('activity:feed', activities)
      } catch (error) {
        socket.emit('error', { message: 'Failed to get activity feed' })
      }
    })
  }

  private handleCollaborationEvents(socket: AuthenticatedSocket) {
    // Document collaboration
    socket.on('document:join', (documentId: string) => {
      socket.join(`document:${documentId}`)
      
      // Notify others in document
      socket.to(`document:${documentId}`).emit('document:user-joined', {
        userId: socket.userId,
        documentId
      })
    })

    socket.on('document:leave', (documentId: string) => {
      socket.leave(`document:${documentId}`)
      
      socket.to(`document:${documentId}`).emit('document:user-left', {
        userId: socket.userId,
        documentId
      })
    })

    socket.on('document:change', (data) => {
      // Broadcast changes to others in the document
      socket.to(`document:${data.documentId}`).emit('document:changed', {
        userId: socket.userId,
        changes: data.changes,
        timestamp: new Date()
      })
    })

    // Cursor and selection sharing
    socket.on('cursor:move', (data) => {
      socket.to(`document:${data.documentId}`).emit('cursor:moved', {
        userId: socket.userId,
        position: data.position
      })
    })

    socket.on('selection:change', (data) => {
      socket.to(`document:${data.documentId}`).emit('selection:changed', {
        userId: socket.userId,
        selection: data.selection
      })
    })
  }

  private handleNotificationEvents(socket: AuthenticatedSocket) {
    // Send notification
    socket.on('notification:send', async (data) => {
      if (!socket.userId) return

      try {
        const notification = await prisma.notification.create({
          data: {
            userId: data.targetUserId,
            type: data.type,
            title: data.title,
            message: data.message,
            actionUrl: data.actionUrl,
            metadata: data.metadata
          }
        })

        // Send to target user
        this.io.to(`user:${data.targetUserId}`).emit('notification:new', notification)
      } catch (error) {
        socket.emit('error', { message: 'Failed to send notification' })
      }
    })

    // Mark as read
    socket.on('notification:read', async (notificationId: string) => {
      if (!socket.userId) return

      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            isRead: true,
            readAt: new Date()
          }
        })

        socket.emit('notification:read-success', notificationId)
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark notification as read' })
      }
    })
  }

  private handlePresenceEvents(socket: AuthenticatedSocket) {
    // Update presence
    socket.on('presence:update', async (status: 'online' | 'away' | 'busy') => {
      if (!socket.userId || !socket.organizationId) return

      const presence = {
        userId: socket.userId,
        status,
        lastSeen: new Date()
      }

      // Broadcast to organization
      this.io.to(`org:${socket.organizationId}`).emit('presence:updated', presence)

      // Update database
      await prisma.user.update({
        where: { id: socket.userId },
        data: { lastActiveAt: new Date() }
      })
    })

    // Get team presence
    socket.on('presence:get-team', async (teamId: string) => {
      if (!socket.teamIds?.includes(teamId)) return

      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              lastActiveAt: true
            }
          }
        }
      })

      const presence = teamMembers.map(member => ({
        userId: member.user.id,
        name: member.user.name,
        avatar: member.user.avatar,
        status: this.getUserStatus(member.user.id),
        lastSeen: member.user.lastActiveAt
      }))

      socket.emit('presence:team', { teamId, presence })
    })
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    if (socket.userId) {
      this.removeUserSocket(socket.userId, socket.id)
    }

    if (socket.organizationId) {
      this.removeFromOrganizationRoom(socket.organizationId, socket.id)
      
      // Notify organization of offline status
      this.io.to(`org:${socket.organizationId}`).emit('presence:updated', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date()
      })
    }

    if (socket.teamIds) {
      socket.teamIds.forEach(teamId => {
        this.removeFromTeamRoom(teamId, socket.id)
      })
    }
  }

  // Broadcasting methods

  public broadcastToOrganization(organizationId: string, event: string, data: any) {
    this.io.to(`org:${organizationId}`).emit(event, data)
  }

  public broadcastToTeam(teamId: string, event: string, data: any) {
    this.io.to(`team:${teamId}`).emit(event, data)
  }

  public broadcastToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  public broadcastMetricUpdate(organizationId: string, metrics: any) {
    this.io.to(`org:${organizationId}`).emit('metrics:updated', metrics)
  }

  public broadcastUsageAlert(organizationId: string, alert: any) {
    this.io.to(`org:${organizationId}`).emit('usage:alert', alert)
  }

  public broadcastSecurityAlert(organizationId: string, alert: any) {
    this.io.to(`org:${organizationId}`).emit('security:alert', alert)
  }

  // Room management

  private addToOrganizationRoom(organizationId: string, socketId: string) {
    if (!this.organizationRooms.has(organizationId)) {
      this.organizationRooms.set(organizationId, new Set())
    }
    this.organizationRooms.get(organizationId)!.add(socketId)
  }

  private removeFromOrganizationRoom(organizationId: string, socketId: string) {
    this.organizationRooms.get(organizationId)?.delete(socketId)
  }

  private addToTeamRoom(teamId: string, socketId: string) {
    if (!this.teamRooms.has(teamId)) {
      this.teamRooms.set(teamId, new Set())
    }
    this.teamRooms.get(teamId)!.add(socketId)
  }

  private removeFromTeamRoom(teamId: string, socketId: string) {
    this.teamRooms.get(teamId)?.delete(socketId)
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set())
    }
    this.userSockets.get(userId)!.add(socketId)
  }

  private removeUserSocket(userId: string, socketId: string) {
    this.userSockets.get(userId)?.delete(socketId)
    
    // If user has no more sockets, they're offline
    if (this.userSockets.get(userId)?.size === 0) {
      this.userSockets.delete(userId)
    }
  }

  private getUserStatus(userId: string): 'online' | 'offline' {
    return this.userSockets.has(userId) ? 'online' : 'offline'
  }

  // Statistics

  public getStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      organizationRooms: this.organizationRooms.size,
      teamRooms: this.teamRooms.size,
      onlineUsers: this.userSockets.size
    }
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null

export function initializeWebSocket(server: HTTPServer): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(server)
  }
  return wsManager
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager
}