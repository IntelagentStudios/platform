'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info,
  X,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RealtimeUpdate {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  product?: string;
  action?: {
    label: string;
    url: string;
  };
}

interface RealtimeUpdatesProps {
  licenseKey: string;
  onUpdate?: (update: RealtimeUpdate) => void;
}

export function RealtimeUpdates({ licenseKey, onUpdate }: RealtimeUpdatesProps) {
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    connectToRealtimeUpdates();

    return () => {
      disconnectFromRealtimeUpdates();
    };
  }, [licenseKey]);

  const connectToRealtimeUpdates = () => {
    // Clean up any existing connection
    disconnectFromRealtimeUpdates();

    // Create SSE connection
    const eventSource = new EventSource(
      `/api/realtime/updates?license=${licenseKey}`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('Connected to realtime updates');
    };

    eventSource.onmessage = (event) => {
      try {
        const update: RealtimeUpdate = JSON.parse(event.data);
        handleUpdate(update);
      } catch (error) {
        console.error('Failed to parse update:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectToRealtimeUpdates();
      }, 5000);
    };

    // Custom event handlers for different update types
    eventSource.addEventListener('usage-alert', (event) => {
      const data = JSON.parse(event.data);
      handleUsageAlert(data);
    });

    eventSource.addEventListener('product-update', (event) => {
      const data = JSON.parse(event.data);
      handleProductUpdate(data);
    });

    eventSource.addEventListener('insight', (event) => {
      const data = JSON.parse(event.data);
      handleInsight(data);
    });

    eventSourceRef.current = eventSource;
  };

  const disconnectFromRealtimeUpdates = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  };

  const handleUpdate = (update: RealtimeUpdate) => {
    // Add to updates list
    setUpdates(prev => [update, ...prev].slice(0, 10)); // Keep last 10 updates

    // Show toast for important updates
    if (update.type === 'error' || update.type === 'warning') {
      toast({
        title: update.title,
        description: update.message,
        variant: update.type === 'error' ? 'destructive' : 'default'
      });
    }

    // Call callback if provided
    if (onUpdate) {
      onUpdate(update);
    }
  };

  const handleUsageAlert = (data: any) => {
    const update: RealtimeUpdate = {
      id: `usage-${Date.now()}`,
      type: data.severity === 'critical' ? 'error' : 'warning',
      title: 'Usage Alert',
      message: `${data.product} usage at ${data.percentage}% of limit`,
      timestamp: new Date(),
      product: data.product,
      action: data.percentage >= 90 ? {
        label: 'Upgrade Now',
        url: '/upgrade'
      } : undefined
    };
    handleUpdate(update);
  };

  const handleProductUpdate = (data: any) => {
    const update: RealtimeUpdate = {
      id: `product-${Date.now()}`,
      type: 'info',
      title: `${data.product} Update`,
      message: data.message,
      timestamp: new Date(),
      product: data.product
    };
    handleUpdate(update);
  };

  const handleInsight = (data: any) => {
    const update: RealtimeUpdate = {
      id: `insight-${Date.now()}`,
      type: 'success',
      title: 'New Insight Available',
      message: data.summary,
      timestamp: new Date(),
      action: {
        label: 'View Insight',
        url: '/dashboard?tab=insights'
      }
    };
    handleUpdate(update);
  };

  const dismissUpdate = (id: string) => {
    setUpdates(prev => prev.filter(u => u.id !== id));
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  if (!showNotifications) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Bell className="h-4 w-4 mr-2" />
        Show Updates ({updates.length})
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[500px] overflow-hidden z-50 shadow-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="font-semibold">Live Updates</span>
          {isConnected ? (
            <Badge variant="outline" className="text-green-600">
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              <WifiOff className="h-3 w-3 mr-1" />
              Reconnecting...
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNotifications(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {updates.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No updates yet</p>
            <p className="text-xs mt-1">Real-time updates will appear here</p>
          </div>
        ) : (
          <div className="divide-y">
            {updates.map(update => (
              <div key={update.id} className="p-3 hover:bg-accent/50 transition-colors">
                <div className="flex items-start gap-3">
                  {getUpdateIcon(update.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{update.title}</p>
                      {update.product && (
                        <Badge variant="secondary" className="text-xs">
                          {update.product}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {update.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {update.action && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => window.location.href = update.action!.url}
                          >
                            {update.action.label}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => dismissUpdate(update.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}