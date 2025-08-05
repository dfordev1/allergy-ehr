import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  Calendar, 
  TestTube, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Download,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalyticsData {
  totalPatients: number;
  totalTests: number;
  totalBookings: number;
  completedTests: number;
  pendingTests: number;
  positiveResults: number;
  negativeResults: number;
  monthlyStats: any[];
  allergenStats: any[];
  testTypeStats: any[];
  ageDistribution: any[];
  genderDistribution: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data
             // Fetch data with error handling for missing tables
       const patientsResult = await supabase.from('patients').select('*');
       const testsResult = await supabase.from('test_sessions').select('*');
       
       // Bookings table might not exist yet, so handle gracefully
       let bookingsResult = { data: [], error: null };
       try {
         bookingsResult = await supabase.from('bookings').select('*');
       } catch (error) {
         console.warn('Bookings table not found, using empty data');
       }

      if (patientsResult.error || testsResult.error || bookingsResult.error) {
        toast.error('Error fetching analytics data');
        return;
      }

      const patients = patientsResult.data || [];
      const tests = testsResult.data || [];
      const bookings = bookingsResult.data || [];

      // Calculate statistics
      const totalPatients = patients.length;
      const totalTests = tests.length;
      const totalBookings = bookings.length;
      const completedTests = tests.filter(t => t.status === 'completed').length;
      const pendingTests = tests.filter(t => t.status === 'pending').length;
      
      let positiveResults = 0;
      let negativeResults = 0;
      
      tests.forEach(test => {
        if (test.results && Array.isArray(test.results)) {
          test.results.forEach((result: any) => {
            if (result.is_positive) positiveResults++;
            else negativeResults++;
          });
        }
      });

      // Monthly statistics
      const monthlyStats = calculateMonthlyStats(tests, timeRange);
      
      // Allergen statistics
      const allergenStats = calculateAllergenStats(tests);
      
      // Test type statistics
      const testTypeStats = calculateTestTypeStats(bookings);
      
      // Age distribution
      const ageDistribution = calculateAgeDistribution(patients);
      
      // Gender distribution
      const genderDistribution = calculateGenderDistribution(patients);

      setData({
        totalPatients,
        totalTests,
        totalBookings,
        completedTests,
        pendingTests,
        positiveResults,
        negativeResults,
        monthlyStats,
        allergenStats,
        testTypeStats,
        ageDistribution,
        genderDistribution
      });
    } catch (error) {
      toast.error('Error fetching analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (tests: any[], range: string) => {
    const months = [];
    const now = new Date();
    const rangeMonths = parseInt(range);
    
    for (let i = rangeMonths - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthTests = tests.filter(test => {
        const testDate = new Date(test.testdate);
        return testDate.getMonth() === date.getMonth() && 
               testDate.getFullYear() === date.getFullYear();
      });
      
      months.push({
        month: monthName,
        tests: monthTests.length,
        completed: monthTests.filter(t => t.status === 'completed').length,
        positive: monthTests.reduce((acc, test) => {
          if (test.results && Array.isArray(test.results)) {
            return acc + test.results.filter((r: any) => r.is_positive).length;
          }
          return acc;
        }, 0)
      });
    }
    
    return months;
  };

  const calculateAllergenStats = (tests: any[]) => {
    const allergenCounts: { [key: string]: number } = {};
    
    tests.forEach(test => {
      if (test.results && Array.isArray(test.results)) {
        test.results.forEach((result: any) => {
          if (result.allergen) {
            allergenCounts[result.allergen] = (allergenCounts[result.allergen] || 0) + 1;
          }
        });
      }
    });
    
    return Object.entries(allergenCounts)
      .map(([allergen, count]) => ({ allergen, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const calculateTestTypeStats = (bookings: any[]) => {
    const typeCounts: { [key: string]: number } = {};
    
    bookings.forEach(booking => {
      if (booking.test_type) {
        typeCounts[booking.test_type] = (typeCounts[booking.test_type] || 0) + 1;
      }
    });
    
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  };

  const calculateAgeDistribution = (patients: any[]) => {
    const ageRanges = [
      { range: '0-18', min: 0, max: 18, count: 0 },
      { range: '19-30', min: 19, max: 30, count: 0 },
      { range: '31-50', min: 31, max: 50, count: 0 },
      { range: '51-65', min: 51, max: 65, count: 0 },
      { range: '65+', min: 66, max: 999, count: 0 }
    ];
    
    patients.forEach(patient => {
      const age = patient.age;
      const range = ageRanges.find(r => age >= r.min && age <= r.max);
      if (range) range.count++;
    });
    
    return ageRanges;
  };

  const calculateGenderDistribution = (patients: any[]) => {
    const genderCounts: { [key: string]: number } = {};
    
    patients.forEach(patient => {
      const gender = patient.sex || 'Unknown';
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    });
    
    return Object.entries(genderCounts)
      .map(([gender, count]) => ({ gender, count }));
  };

  const exportReport = () => {
    if (!data) return;
    
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange: `${timeRange} days`,
      statistics: {
        totalPatients: data.totalPatients,
        totalTests: data.totalTests,
        totalBookings: data.totalBookings,
        completedTests: data.completedTests,
        pendingTests: data.pendingTests,
        positiveResults: data.positiveResults,
        negativeResults: data.negativeResults
      },
      monthlyStats: data.monthlyStats,
      allergenStats: data.allergenStats,
      testTypeStats: data.testTypeStats
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Analytics report exported successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive insights into your allergy testing practice</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                Active patients in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalTests}</div>
              <p className="text-xs text-muted-foreground">
                {data.completedTests} completed, {data.pendingTests} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled appointments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive Results</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.positiveResults}</div>
              <p className="text-xs text-muted-foreground">
                {data.negativeResults} negative results
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="allergens">Allergens</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Test Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tests" fill="#8884d8" name="Total Tests" />
                      <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: data.completedTests, color: '#82ca9d' },
                          { name: 'Pending', value: data.pendingTests, color: '#ffc658' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.monthlyStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Results Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tests" stroke="#8884d8" name="Total Tests" />
                    <Line type="monotone" dataKey="positive" stroke="#ff7300" name="Positive Results" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allergens" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Allergens</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.allergenStats} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="allergen" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.testTypeStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {data.testTypeStats.map((entry, index) => (
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

          <TabsContent value="demographics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Age Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.ageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gender Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.genderDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ gender, percent }) => `${gender} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {data.genderDistribution.map((entry, index) => (
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
        </Tabs>
      </main>
    </div>
  );
}; 