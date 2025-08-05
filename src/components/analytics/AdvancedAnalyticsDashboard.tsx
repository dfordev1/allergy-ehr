import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

import { 
  TrendingUp, 
  Users, 
  TestTube, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target
} from 'lucide-react';

interface AnalyticsData {
  patients: any[];
  tests: any[];
  bookings: any[];
  allergenResults: any[];
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['advanced-analytics', timeRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      const [patientsRes, testsRes, bookingsRes] = await Promise.all([
        supabase.from('patients').select('*').gte('createdat', startDate.toISOString()),
        supabase.from('test_sessions').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('bookings').select('*').gte('created_at', startDate.toISOString()).catch(() => ({ data: [] }))
      ]);

      return {
        patients: patientsRes.data || [],
        tests: testsRes.data || [],
        bookings: bookingsRes.data || [],
        allergenResults: [] // Would be populated from enhanced allergy tests
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!analyticsData) return [];

    const { patients, tests, bookings } = analyticsData;
    
    const totalPatients = patients.length;
    const totalTests = tests.length;
    const totalBookings = bookings.length;
    const completedTests = tests.filter(t => t.status === 'completed').length;
    const positiveTests = tests.filter(t => t.result === 'positive').length;
    
    // Calculate completion rate
    const completionRate = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;
    
    // Calculate positive rate
    const positiveRate = completedTests > 0 ? (positiveTests / completedTests) * 100 : 0;
    
    // Mock previous period data for comparison (would be calculated from actual data)
    const previousPeriodGrowth = Math.random() * 20 - 10; // -10% to +10%

    return [
      {
        title: 'Total Patients',
        value: totalPatients,
        change: previousPeriodGrowth,
        changeType: previousPeriodGrowth > 0 ? 'positive' : 'negative',
        icon: <Users className="h-4 w-4" />,
        description: `${timeRange} days period`
      },
      {
        title: 'Tests Completed',
        value: completedTests,
        change: Math.random() * 15 - 5,
        changeType: 'positive',
        icon: <TestTube className="h-4 w-4" />,
        description: `${completionRate.toFixed(1)}% completion rate`
      },
      {
        title: 'Appointments',
        value: totalBookings,
        change: Math.random() * 25 - 10,
        changeType: 'positive',
        icon: <Calendar className="h-4 w-4" />,
        description: 'Scheduled appointments'
      },
      {
        title: 'Positive Results',
        value: `${positiveRate.toFixed(1)}%`,
        change: Math.random() * 10 - 5,
        changeType: 'neutral',
        icon: <AlertTriangle className="h-4 w-4" />,
        description: 'Of completed tests'
      }
    ] as MetricCard[];
  }, [analyticsData, timeRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analyticsData) return {};

    const { patients, tests, bookings } = analyticsData;

    // Daily activity data
    const dailyData = [];
    for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayPatients = patients.filter(p => p.createdat?.startsWith(dateStr)).length;
      const dayTests = tests.filter(t => t.created_at?.startsWith(dateStr)).length;
      const dayBookings = bookings.filter(b => b.created_at?.startsWith(dateStr)).length;
      
      dailyData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        patients: dayPatients,
        tests: dayTests,
        bookings: dayBookings,
        total: dayPatients + dayTests + dayBookings
      });
    }

    // Age distribution
    const ageGroups = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0
    };
    
    patients.forEach(p => {
      const age = p.age;
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 35) ageGroups['19-35']++;
      else if (age <= 50) ageGroups['36-50']++;
      else if (age <= 65) ageGroups['51-65']++;
      else ageGroups['65+']++;
    });

    const ageDistribution = Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count,
      percentage: patients.length > 0 ? (count / patients.length) * 100 : 0
    }));

    // Gender distribution
    const genderCounts = patients.reduce((acc, p) => {
      acc[p.sex] = (acc[p.sex] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const genderDistribution = Object.entries(genderCounts).map(([gender, count]) => ({
      gender,
      count,
      percentage: patients.length > 0 ? (count / patients.length) * 100 : 0
    }));

    // Test status distribution
    const testStatusCounts = tests.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const testStatusDistribution = Object.entries(testStatusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: tests.length > 0 ? (count / tests.length) * 100 : 0
    }));

    // Performance metrics over time
    const performanceData = dailyData.map(day => ({
      date: day.date,
      efficiency: day.tests > 0 ? (day.tests / (day.patients || 1)) * 100 : 0,
      capacity: Math.min((day.total / 10) * 100, 100), // Assuming capacity of 10 per day
      satisfaction: 85 + Math.random() * 15 // Mock satisfaction score
    }));

    return {
      daily: dailyData,
      ageDistribution,
      genderDistribution,
      testStatusDistribution,
      performance: performanceData
    };
  }, [analyticsData, timeRange]);

  const exportData = () => {
    if (!analyticsData) return;
    
    const exportObj = {
      summary: metrics,
      rawData: analyticsData,
      charts: chartData,
      generatedAt: new Date().toISOString(),
      timeRange: `${timeRange} days`
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your allergy clinic performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                </div>
                <div className="text-muted-foreground">
                  {metric.icon}
                </div>
              </div>
              
              <div className="mt-4 flex items-center">
                <Badge 
                  variant={metric.changeType === 'positive' ? 'default' : 
                          metric.changeType === 'negative' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">vs previous period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advanced Charts */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Daily Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="patients" fill="#0088FE" name="New Patients" />
                    <Bar dataKey="tests" fill="#00C49F" name="Tests" />
                    <Bar dataKey="bookings" fill="#FFBB28" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Test Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="h-5 w-5" />
                  <span>Test Status Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.testStatusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                    >
                      {chartData.testStatusDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.ageDistribution} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="range" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gender Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.genderDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ gender, percentage }) => `${gender}: ${percentage.toFixed(1)}%`}
                    >
                      {chartData.genderDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData.performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="efficiency" stroke="#0088FE" name="Test Efficiency %" />
                  <Line type="monotone" dataKey="capacity" stroke="#00C49F" name="Capacity Utilization %" />
                  <Line type="monotone" dataKey="satisfaction" stroke="#FFBB28" name="Patient Satisfaction %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Activity Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="total" stackId="1" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} name="Total Activity" />
                  <Area type="monotone" dataKey="patients" stackId="2" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} name="New Patients" />
                  <Area type="monotone" dataKey="tests" stackId="2" stroke="#FFBB28" fill="#FFBB28" fillOpacity={0.6} name="Tests" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* AI-powered Insights (Mock) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Key Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Peak Activity</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Highest patient volume occurs on Tuesdays and Wednesdays. Consider optimizing staff schedules.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Capacity Alert</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Testing capacity utilization is at 85%. Consider expanding testing slots during peak hours.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Performance</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Test completion rate has improved by 12% compared to last month. Great job!
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg bg-blue-50">
                  <h4 className="font-medium text-blue-900 mb-2">Optimize Scheduling</h4>
                  <p className="text-sm text-blue-700">
                    Implement online booking to reduce no-shows and optimize appointment distribution.
                  </p>
                </div>

                <div className="p-3 border rounded-lg bg-green-50">
                  <h4 className="font-medium text-green-900 mb-2">Expand Services</h4>
                  <p className="text-sm text-green-700">
                    High demand for environmental allergy testing. Consider adding more allergen panels.
                  </p>
                </div>

                <div className="p-3 border rounded-lg bg-purple-50">
                  <h4 className="font-medium text-purple-900 mb-2">Patient Communication</h4>
                  <p className="text-sm text-purple-700">
                    Implement automated reminder system to improve appointment attendance rates.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};