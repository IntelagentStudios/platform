export interface SecurityEvent {
  id: string;
  type: 'LOGIN' | 'LOGOUT' | 'PERMISSION_CHANGE' | 'DATA_ACCESS' | 'API_CALL';
  userId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  eventId: string;
  organizationId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}