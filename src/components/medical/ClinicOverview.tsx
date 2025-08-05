import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Calendar, 
  TestTube, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Stethoscope,
  FileText
} from 'lucide-react';

interface ClinicStats {
  totalPatients: number;
  todayAppointments: number;
  pendingTests: number;
  completedTests: number;
  criticalAlerts: number;
  recentActivity: number;
}

export const ClinicOverview: React.FC = () => {
  const [stats, setStats] = useState<ClinicStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingTests: 0,
    completedTests: 0,
    criticalAlerts: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinicStats();
  }, []);

  const fetchClinicStats = async () => {
    try {
      setLoading(true);

      // Fetch patients count
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // Fetch today's bookings
      const today = new Date().toISOString().split('T')[0];
      const { count: todayBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_date', today);

      // Fetch test sessions
      const { data: tests } = await supabase
        .from('test_sessions')
        .select('status');

      const pendingTests = tests?.filter(t => t.status === 'pending').length || 0;
      const completedTests = tests?.filter(t => t.status === 'completed').length || 0;

      setStats({
        totalPatients: patientsCount || 0,
        todayAppointments: todayBookings || 0,
        pendingTests,
        completedTests,
        criticalAlerts: 0, // Would be calculated based on test results
        recentActivity: (patientsCount || 0) + (todayBookings || 0) + pendingTests,
      });

    } catch (error) {
      console.error('Error fetching clinic stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickStats = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: <Users className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Tests',
      value: stats.pendingTests,
      icon: <TestTube className="h-4 w-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Completed Tests',
      value: stats.completedTests,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  const recentAlerts = [
    {
      type: 'info',
      message: 'New patient registration completed',
      time: '5 minutes ago',
      icon: <Users className="h-4 w-4" />,
    },
    {
      type: 'warning',
      message: 'Allergy test results require review',
      time: '15 minutes ago',
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      type: 'success',
      message: 'Daily backup completed successfully',
      time: '1 hour ago',
      icon: <CheckCircle className="h-4 w-4" />,
    },
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Clinical Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Today's Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Morning Appointments</p>
                    <p className="text-sm text-muted-foreground">9:00 AM - 12:00 PM</p>
                  </div>
                </div>
                <Badge variant="outline">{Math.floor(stats.todayAppointments / 2)}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Afternoon Appointments</p>
                    <p className="text-sm text-muted-foreground">1:00 PM - 5:00 PM</p>
                  </div>
                </div>
                <Badge variant="outline">{Math.ceil(stats.todayAppointments / 2)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`p-1 rounded ${getAlertColor(alert.type)}`}>
                    {alert.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Stethoscope className="h-5 w-5" />
            <span>Clinical Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.completedTests}</div>
              <p className="text-sm text-muted-foreground">Tests Completed This Week</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalPatients}</div>
              <p className="text-sm text-muted-foreground">Active Patients</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.pendingTests}</div>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};