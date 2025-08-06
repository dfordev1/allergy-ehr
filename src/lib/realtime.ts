// ============================================================================
// REAL-TIME UPDATES & WEBSOCKET INTEGRATION
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cacheManager } from '@/lib/cache';
import config from '@/config/app';

export interface RealtimeEvent {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, any>;
  old?: Record<string, any>;
  timestamp: number;
}

export interface RealtimeSubscription {
  id: string;
  table: string;
  filter?: string;
  callback: (event: RealtimeEvent) => void;
}

class RealtimeManager {
  private subscriptions = new Map<string, RealtimeSubscription>();
  private channels = new Map<string, any>();
  private isEnabled: boolean = config.features.notifications;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    if (this.isEnabled) {
      this.setupConnectionMonitoring();
    }
  }

  private setupConnectionMonitoring(): void {
    // Monitor connection status
    supabase.channel('system').subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.reconnectAttempts = 0;
        if (this.reconnectAttempts > 0) {
          toast.success('Real-time connection restored');
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        this.handleConnectionError();
      }
    });
  }

  private async handleConnectionError(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      toast.warning(`Connection lost. Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnectAllSubscriptions();
      }, delay);
    } else {
      toast.error('Real-time connection failed. Please refresh the page.');
    }
  }

  private reconnectAllSubscriptions(): void {
    this.subscriptions.forEach((subscription) => {
      this.unsubscribe(subscription.id);
      this.subscribe(subscription.table, subscription.callback, subscription.filter, subscription.id);
    });
  }

  subscribe(
    table: string,
    callback: (event: RealtimeEvent) => void,
    filter?: string,
    customId?: string
  ): string {
    if (!this.isEnabled) return '';

    const id = customId || `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: RealtimeSubscription = {
      id,
      table,
      filter,
      callback: (event) => {
        // Invalidate relevant caches
        this.invalidateRelatedCaches(table, event);
        
        // Call the original callback
        callback(event);
        
        // Show notification if configured
        this.showRealtimeNotification(table, event);
      }
    };

    // Create or reuse channel
    let channel = this.channels.get(table);
    if (!channel) {
      channel = supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: filter
          },
          (payload) => {
            const event: RealtimeEvent = {
              table,
              eventType: payload.eventType as any,
              new: payload.new,
              old: payload.old,
              timestamp: Date.now()
            };
            
            // Notify all subscribers for this table
            this.subscriptions.forEach((sub) => {
              if (sub.table === table) {
                sub.callback(event);
              }
            });
          }
        )
        .subscribe();

      this.channels.set(table, channel);
    }

    this.subscriptions.set(id, subscription);
    return id;
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    this.subscriptions.delete(subscriptionId);

    // If no more subscriptions for this table, remove the channel
    const hasOtherSubscriptions = Array.from(this.subscriptions.values())
      .some(sub => sub.table === subscription.table);

    if (!hasOtherSubscriptions) {
      const channel = this.channels.get(subscription.table);
      if (channel) {
        supabase.removeChannel(channel);
        this.channels.delete(subscription.table);
      }
    }
  }

  private invalidateRelatedCaches(table: string, event: RealtimeEvent): void {
    switch (table) {
      case 'patients':
        cacheManager.patients.clear();
        if (event.new?.id || event.old?.id) {
          const patientId = event.new?.id || event.old?.id;
          cacheManager.invalidatePatientRelated(patientId);
        }
        break;
      
      case 'bookings':
        cacheManager.bookings.clear();
        if (event.new?.id || event.old?.id) {
          const bookingId = event.new?.id || event.old?.id;
          cacheManager.invalidateBookingRelated(bookingId);
        }
        break;
      
      case 'enhanced_allergy_tests':
      case 'test_sessions':
        cacheManager.testResults.clear();
        break;
      
      default:
        // For unknown tables, clear all caches to be safe
        cacheManager.clearAll();
    }
  }

  private showRealtimeNotification(table: string, event: RealtimeEvent): void {
    if (!config.features.notifications) return;

    const entityName = this.getEntityName(table);
    const action = this.getActionName(event.eventType);
    
    switch (event.eventType) {
      case 'INSERT':
        toast.success(`New ${entityName} ${action}`, {
          description: this.getEntityDescription(table, event.new),
          duration: 4000
        });
        break;
      
      case 'UPDATE':
        toast.info(`${entityName} ${action}`, {
          description: this.getEntityDescription(table, event.new),
          duration: 3000
        });
        break;
      
      case 'DELETE':
        toast.warning(`${entityName} ${action}`, {
          description: this.getEntityDescription(table, event.old),
          duration: 3000
        });
        break;
    }
  }

  private getEntityName(table: string): string {
    const entityNames: Record<string, string> = {
      patients: 'Patient',
      bookings: 'Booking',
      enhanced_allergy_tests: 'Allergy Test',
      test_sessions: 'Test Session',
      user_profiles: 'User Profile'
    };
    return entityNames[table] || 'Record';
  }

  private getActionName(eventType: string): string {
    const actionNames: Record<string, string> = {
      INSERT: 'created',
      UPDATE: 'updated',
      DELETE: 'deleted'
    };
    return actionNames[eventType] || 'changed';
  }

  private getEntityDescription(table: string, data: Record<string, any> | undefined): string {
    if (!data) return '';

    switch (table) {
      case 'patients':
        return data.name ? `${data.name} (${data.labno || 'No lab number'})` : 'Unknown patient';
      
      case 'bookings':
        return data.appointment_date 
          ? `Appointment on ${data.appointment_date}${data.appointment_time ? ' at ' + data.appointment_time : ''}`
          : 'Unknown booking';
      
      case 'enhanced_allergy_tests':
        return data.patient_info?.name 
          ? `Test for ${data.patient_info.name}`
          : 'Unknown test';
      
      default:
        return data.name || data.title || data.id || 'Unknown';
    }
  }

  // Get active subscriptions info
  getSubscriptions(): Array<{ id: string; table: string; filter?: string }> {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      table: sub.table,
      filter: sub.filter
    }));
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.subscriptions.forEach((_, id) => this.unsubscribe(id));
    this.channels.clear();
  }

  // Enable/disable real-time features
  setEnabled(enabled: boolean): void {
    if (enabled === this.isEnabled) return;

    this.isEnabled = enabled;
    
    if (!enabled) {
      this.cleanup();
      toast.info('Real-time updates disabled');
    } else {
      toast.success('Real-time updates enabled');
    }
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  realtimeManager.cleanup();
});

// React hooks for real-time functionality
export function useRealtime(
  table: string,
  callback: (event: RealtimeEvent) => void,
  filter?: string,
  enabled: boolean = true
) {
  const [subscriptionId, setSubscriptionId] = React.useState<string>('');

  React.useEffect(() => {
    if (!enabled) return;

    const id = realtimeManager.subscribe(table, callback, filter);
    setSubscriptionId(id);

    return () => {
      if (id) {
        realtimeManager.unsubscribe(id);
      }
    };
  }, [table, filter, enabled]);

  return {
    subscriptionId,
    isSubscribed: !!subscriptionId
  };
}

export function useRealtimePatients(callback: (event: RealtimeEvent) => void) {
  return useRealtime('patients', callback);
}

export function useRealtimeBookings(callback: (event: RealtimeEvent) => void) {
  return useRealtime('bookings', callback);
}

export function useRealtimeAllergyTests(callback: (event: RealtimeEvent) => void) {
  return useRealtime('enhanced_allergy_tests', callback);
}

// Presence system for showing who's online
export class PresenceManager {
  private channel: any;
  private userId: string;
  private userInfo: Record<string, any>;

  constructor(userId: string, userInfo: Record<string, any> = {}) {
    this.userId = userId;
    this.userInfo = userInfo;
    this.setupPresence();
  }

  private setupPresence(): void {
    this.channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: this.userId
        }
      }
    });

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState();
        const users = Object.keys(state).map(userId => ({
          userId,
          ...state[userId][0]
        }));
        
        this.onPresenceUpdate(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const user = { userId: key, ...newPresences[0] };
        this.onUserJoin(user);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const user = { userId: key, ...leftPresences[0] };
        this.onUserLeave(user);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel.track({
            userId: this.userId,
            onlineAt: new Date().toISOString(),
            ...this.userInfo
          });
        }
      });
  }

  private onPresenceUpdate(users: Array<any>): void {
    console.log('Users online:', users.length);
  }

  private onUserJoin(user: any): void {
    if (user.userId !== this.userId) {
      toast.success(`${user.name || user.userId} joined`, { duration: 2000 });
    }
  }

  private onUserLeave(user: any): void {
    if (user.userId !== this.userId) {
      toast.info(`${user.name || user.userId} left`, { duration: 2000 });
    }
  }

  updateInfo(userInfo: Record<string, any>): void {
    this.userInfo = { ...this.userInfo, ...userInfo };
    if (this.channel) {
      this.channel.track({
        userId: this.userId,
        onlineAt: new Date().toISOString(),
        ...this.userInfo
      });
    }
  }

  cleanup(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
  }
}

export default realtimeManager;