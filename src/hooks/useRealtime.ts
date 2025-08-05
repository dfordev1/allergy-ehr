import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface RealtimeNotification {
  id: string;
  type: 'patient_added' | 'test_completed' | 'booking_created' | 'user_activity';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

export const useRealtime = () => {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to patients table changes
    const patientsSubscription = supabase
      .channel('patients_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          console.log('Patient change received:', payload);
          
          // Invalidate patients query to refetch data
          queryClient.invalidateQueries({ queryKey: ['patients'] });
          
          // Show notification
          if (payload.eventType === 'INSERT') {
            const newNotification: RealtimeNotification = {
              id: `patient-${payload.new.id}-${Date.now()}`,
              type: 'patient_added',
              title: 'New Patient Added',
              message: `${payload.new.name} has been registered`,
              timestamp: new Date().toISOString(),
              data: payload.new
            };
            
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
            toast.success(`New patient: ${payload.new.name}`);
          }
        }
      )
      .subscribe((status) => {
        console.log('Patients subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to test_sessions table changes
    const testsSubscription = supabase
      .channel('tests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_sessions'
        },
        (payload) => {
          console.log('Test change received:', payload);
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['test_sessions'] });
          if (payload.new?.patient_id) {
            queryClient.invalidateQueries({ queryKey: ['patient', payload.new.patient_id] });
          }
          
          // Show notification for completed tests
          if (payload.eventType === 'UPDATE' && payload.new.status === 'completed') {
            const newNotification: RealtimeNotification = {
              id: `test-${payload.new.id}-${Date.now()}`,
              type: 'test_completed',
              title: 'Test Completed',
              message: `Allergy test completed for patient`,
              timestamp: new Date().toISOString(),
              data: payload.new
            };
            
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
            toast.info('Test completed');
          }
        }
      )
      .subscribe();

    // Subscribe to bookings table changes
    const bookingsSubscription = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Booking change received:', payload);
          
          // Invalidate bookings query
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          
          // Show notification for new bookings
          if (payload.eventType === 'INSERT') {
            const newNotification: RealtimeNotification = {
              id: `booking-${payload.new.id}-${Date.now()}`,
              type: 'booking_created',
              title: 'New Appointment',
              message: `Appointment scheduled for ${payload.new.patient_name}`,
              timestamp: new Date().toISOString(),
              data: payload.new
            };
            
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
            toast.success(`New appointment: ${payload.new.patient_name}`);
          }
        }
      )
      .subscribe();

    // Subscribe to user activity (activity_logs)
    const activitySubscription = supabase
      .channel('activity_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          console.log('Activity change received:', payload);
          
          // Only show notifications for other users' activities
          if (payload.new.user_id !== supabase.auth.getUser().then(u => u.data.user?.id)) {
            const newNotification: RealtimeNotification = {
              id: `activity-${payload.new.id}-${Date.now()}`,
              type: 'user_activity',
              title: 'User Activity',
              message: `${payload.new.action} on ${payload.new.resource_type}`,
              timestamp: new Date().toISOString(),
              data: payload.new
            };
            
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      patientsSubscription.unsubscribe();
      testsSubscription.unsubscribe();
      bookingsSubscription.unsubscribe();
      activitySubscription.unsubscribe();
    };
  }, [queryClient]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    isConnected,
    clearNotifications,
    removeNotification
  };
};

// Hook for specific table realtime updates
export const useRealtimeTable = (table: string, queryKey: string[]) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`${table} change received:`, payload);
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [table, queryKey, queryClient]);

  return { isConnected };
};