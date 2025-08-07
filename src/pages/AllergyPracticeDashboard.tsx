import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TestTube, 
  Users, 
  Calendar, 
  Syringe, 
  FileText, 
  Package, 
  Smartphone, 
  Pill, 
  DollarSign, 
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  RefreshCw,
  Bell,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  AlertCircle,
  Zap,
  Target,
  Shield,
  Database,
  Wifi,
  Server
} from 'lucide-react';
import { AllergyPracticeApiService } from '@/services/allergyPracticeApi';
import { AppHeader } from '@/components/layout/AppHeader';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  todaysOrders: number;
  todaysInjections: number;
  todaysCheckins: number;
  pendingCharges: number;
  weeklyGrowth: number;
  monthlyRevenue: number;
  activePatients: number;
  upcomingAppointments: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'injection' | 'checkin' | 'handout' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'alert';
  icon: React.ReactNode;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

export const AllergyPracticeDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todaysOrders: 0,
    todaysInjections: 0,
    todaysCheckins: 0,
    pendingCharges: 0,
    weeklyGrowth: 0,
    monthlyRevenue: 0,
    activePatients: 0,
    upcomingAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    loadDashboardData();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const dashboardStats = await AllergyPracticeApiService.getDashboardStats();
      setStats(dashboardStats);
      
      // Simulate recent activity
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'order',
          title: 'New Skin Test Order',
          description: 'Patient: Sarah Johnson - Comprehensive Panel',
          timestamp: '2 minutes ago',
          status: 'completed',
          icon: <TestTube className="h-4 w-4" />
        },
        {
          id: '2',
          type: 'injection',
          title: 'Immunotherapy Injection',
          description: 'Patient: Mike Chen - Maintenance Dose',
          timestamp: '15 minutes ago',
          status: 'completed',
          icon: <Syringe className="h-4 w-4" />
        },
        {
          id: '3',
          type: 'checkin',
          title: 'Patient Check-in',
          description: 'Patient: Lisa Rodriguez - Contactless',
          timestamp: '1 hour ago',
          status: 'completed',
          icon: <Smartphone className="h-4 w-4" />
        },
        {
          id: '4',
          type: 'handout',
          title: 'Patient Handout Generated',
          description: 'Allergy Management Guide - Custom',
          timestamp: '2 hours ago',
          status: 'completed',
          icon: <FileText className="h-4 w-4" />
        },
        {
          id: '5',
          type: 'alert',
          title: 'Low Stock Alert',
          description: 'Grass pollen extract running low',
          timestamp: '3 hours ago',
          status: 'alert',
          icon: <AlertTriangle className="h-4 w-4" />
        }
      ];
      setRecentActivity(mockActivity);

      // Simulate system alerts
      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Inventory Alert',
          message: 'Grass pollen extract stock below 20%',
          timestamp: '2 hours ago',
          priority: 'medium'
        },
        {
          id: '2',
          type: 'info',
          title: 'System Update',
          message: 'New features available in Patient Handouts module',
          timestamp: '1 day ago',
          priority: 'low'
        }
      ];
      setAlerts(mockAlerts);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const quickActions = [
    {
      id: 'new-skin-test',
      title: 'New Skin Test',
      description: 'Order comprehensive testing',
      icon: <TestTube className="h-5 w-5" />,
      action: () => navigate('/practice/skin-tests'),
      color: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    },
    {
      id: 'patient-checkin',
      title: 'Patient Check-in',
      description: 'Contactless arrival',
      icon: <Smartphone className="h-5 w-5" />,
      action: () => navigate('/practice/checkin'),
      color: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    },
    {
      id: 'injection-admin',
      title: 'Record Injection',
      description: 'Immunotherapy admin',
      icon: <Syringe className="h-5 w-5" />,
      action: () => toast.info('Injection module coming soon!'),
      color: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    },
    {
      id: 'extract-order',
      title: 'Extract Order',
      description: 'Custom vial mixing',
      icon: <Package className="h-5 w-5" />,
      action: () => toast.info('Extract module coming soon!'),
      color: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
    },
    {
      id: 'patient-handout',
      title: 'Generate Handout',
      description: 'Patient education',
      icon: <FileText className="h-5 w-5" />,
      action: () => navigate('/practice/handouts'),
      color: 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
    },
    {
      id: 'biologic-admin',
      title: 'Biologic Admin',
      description: 'Advanced treatments',
      icon: <Pill className="h-5 w-5" />,
      action: () => toast.info('Biologics module coming soon!'),
      color: 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700'
    }
  ];

  const moduleCards = [
    {
      id: 'skin-tests',
      title: 'Skin Test Orders & Results',
      description: 'Comprehensive skin testing workflow with custom allergens and panels',
      icon: <TestTube className="h-8 w-8" />,
      stats: `${stats.todaysOrders} orders today`,
      color: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50',
      route: '/practice/skin-tests',
      status: 'active'
    },
    {
      id: 'custom-allergens',
      title: 'Custom Allergens & Panels',
      description: 'Manage custom allergens and create specialized testing panels',
      icon: <Settings className="h-8 w-8" />,
      stats: 'Active allergen library',
      color: 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50',
      route: '/practice/custom-allergens',
      status: 'active'
    },
    {
      id: 'handouts',
      title: 'Patient Allergy Handouts',
      description: 'Generate personalized educational materials and care instructions',
      icon: <FileText className="h-8 w-8" />,
      stats: 'Automated generation',
      color: 'border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100/50',
      route: '/practice/handouts',
      status: 'active'
    },
    {
      id: 'extracts',
      title: 'Extract Orders & Vial Mixing',
      description: 'Immunotherapy extract management with automated labeling',
      icon: <Package className="h-8 w-8" />,
      stats: 'Quality controlled',
      color: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50',
      status: 'coming-soon'
    },
    {
      id: 'vial-labels',
      title: 'Vial & Shipping Labels',
      description: 'Automated label generation with barcodes and tracking',
      icon: <Package className="h-8 w-8" />,
      stats: 'Barcode enabled',
      color: 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100/50',
      status: 'coming-soon'
    },
    {
      id: 'injections',
      title: 'Injection Administration',
      description: 'Track immunotherapy with safety protocols and monitoring',
      icon: <Syringe className="h-8 w-8" />,
      stats: `${stats.todaysInjections} injections today`,
      color: 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50',
      status: 'coming-soon'
    },
    {
      id: 'checkin',
      title: 'Contactless Check-in',
      description: 'Digital patient check-in with symptom screening',
      icon: <Smartphone className="h-8 w-8" />,
      stats: `${stats.todaysCheckins} check-ins today`,
      color: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/50',
      route: '/practice/checkin',
      status: 'active'
    },
    {
      id: 'biologics',
      title: 'Biologic Administration',
      description: 'Advanced biologic treatment management and monitoring',
      icon: <Pill className="h-8 w-8" />,
      stats: 'FDA compliant',
      color: 'border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100/50',
      status: 'coming-soon'
    },
    {
      id: 'auto-charging',
      title: 'Advanced Auto-charging',
      description: 'Automated billing and insurance processing',
      icon: <DollarSign className="h-8 w-8" />,
      stats: `${stats.pendingCharges} pending charges`,
      color: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50',
      status: 'coming-soon'
    },
    {
      id: 'spirometry',
      title: 'Spirometry & RPM',
      description: 'Pulmonary function testing and remote patient monitoring',
      icon: <Activity className="h-8 w-8" />,
      stats: 'Real-time monitoring',
      color: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50',
      status: 'coming-soon'
    },
    {
      id: 'qcdr',
      title: 'AAAAI QCDR Integration',
      description: 'Quality reporting and registry compliance',
      icon: <BarChart3 className="h-8 w-8" />,
      stats: 'Quality metrics',
      color: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50',
      status: 'coming-soon'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'coming-soon': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'coming-soon': return <Clock className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <div className="text-lg">Loading practice dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Allergy Practice Management</h1>
              <p className="mt-1 text-gray-600">Comprehensive allergy and immunology practice management system</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                System Operational
              </Badge>
              <Button 
                variant="outline" 
                onClick={loadDashboardData}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Today's Orders</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.todaysOrders}</p>
                    <div className="flex items-center text-xs text-blue-700">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +12% from yesterday
                    </div>
                  </div>
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <TestTube className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Injections</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.todaysInjections}</p>
                    <div className="flex items-center text-xs text-purple-700">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +8% from yesterday
                    </div>
                  </div>
                  <div className="p-2 bg-purple-200 rounded-lg">
                    <Syringe className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Check-ins</p>
                    <p className="text-2xl font-bold text-green-900">{stats.todaysCheckins}</p>
                    <div className="flex items-center text-xs text-green-700">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +15% from yesterday
                    </div>
                  </div>
                  <div className="p-2 bg-green-200 rounded-lg">
                    <Smartphone className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Pending Charges</p>
                    <p className="text-2xl font-bold text-emerald-900">${stats.pendingCharges.toLocaleString()}</p>
                    <div className="flex items-center text-xs text-emerald-700">
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      -5% from yesterday
                    </div>
                  </div>
                  <div className="p-2 bg-emerald-200 rounded-lg">
                    <DollarSign className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className={`h-auto p-4 flex flex-col items-center space-y-2 text-white border-0 ${action.color}`}
                    onClick={action.action}
                  >
                    {action.icon}
                    <div className="text-center">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs opacity-90">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="modules" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="modules">System Modules</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="alerts">Alerts & Status</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moduleCards.map((module) => (
                  <Card key={module.id} className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${module.color}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          {module.icon}
                          <span>{module.title}</span>
                        </CardTitle>
                        <Badge className={`text-xs ${getStatusColor(module.status)}`}>
                          {getStatusIcon(module.status)}
                          <span className="ml-1">{module.status === 'active' ? 'Active' : 'Coming Soon'}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {module.stats}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (module.route) {
                              navigate(module.route);
                            } else {
                              toast.info(`${module.title} module coming soon!`);
                            }
                          }}
                        >
                          {module.status === 'active' ? 'Open Module' : 'Coming Soon'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className={`p-2 rounded-full ${activity.status === 'alert' ? 'bg-red-100' : 'bg-green-100'}`}>
                          {activity.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{activity.title}</h4>
                            <span className="text-xs text-gray-500">{activity.timestamp}</span>
                          </div>
                          <p className="text-xs text-gray-600">{activity.description}</p>
                        </div>
                        <Badge variant={activity.status === 'alert' ? 'destructive' : 'secondary'} className="text-xs">
                          {activity.status === 'alert' ? 'Alert' : 'Completed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* System Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>System Alerts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div key={alert.id} className={`p-3 rounded-lg border ${
                          alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          alert.type === 'error' ? 'bg-red-50 border-red-200' :
                          alert.type === 'success' ? 'bg-green-50 border-green-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                              alert.type === 'warning' ? 'text-yellow-600' :
                              alert.type === 'error' ? 'text-red-600' :
                              alert.type === 'success' ? 'text-green-600' :
                              'text-blue-600'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{alert.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {alert.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>System Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <Database className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Database</p>
                            <p className="text-sm text-green-700">Operational</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <Server className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">API Services</p>
                            <p className="text-sm text-green-700">All systems go</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <Wifi className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Integrations</p>
                            <p className="text-sm text-green-700">Connected</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">Last Updated</p>
                            <p className="text-sm text-blue-700">Just now</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Live</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};