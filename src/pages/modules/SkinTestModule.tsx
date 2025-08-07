import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  TestTube, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { SkinTestOrderForm } from '@/components/skin-tests/SkinTestOrderForm';
import { AllergyPracticeApiService } from '@/services/allergyPracticeApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface SkinTestOrder {
  id: string;
  patient_id: string;
  order_date: string;
  ordered_by: string;
  test_panels: string[];
  custom_allergens: string[];
  priority: 'routine' | 'urgent' | 'stat';
  status: 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  instructions?: string;
  patient?: {
    name: string;
    labno: string;
  };
}

export const SkinTestModule = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SkinTestOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await AllergyPracticeApiService.getSkinTestOrders();
      if (result.data) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load skin test orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSuccess = () => {
    setShowOrderForm(false);
    loadOrders();
    toast.success('Skin test order created successfully!');
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await AllergyPracticeApiService.updateSkinTestOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.patient?.labno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.ordered_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: orders.length,
    ordered: orders.filter(o => o.status === 'ordered').length,
    scheduled: orders.filter(o => o.status === 'scheduled').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  if (showOrderForm) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowOrderForm(false)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Orders</span>
            </Button>
          </div>
          <SkinTestOrderForm
            onSuccess={handleOrderSuccess}
            onCancel={() => setShowOrderForm(false)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/practice')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Practice
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                  <TestTube className="h-8 w-8 text-blue-600" />
                  <span>Skin Test Orders & Results</span>
                </h1>
                <p className="mt-1 text-gray-600">Comprehensive skin testing workflow management</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={loadOrders}>
                <Search className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setShowOrderForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-900">{orderStats.total}</p>
                  </div>
                  <TestTube className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Ordered</p>
                    <p className="text-2xl font-bold text-yellow-900">{orderStats.ordered}</p>
                  </div>
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Scheduled</p>
                    <p className="text-2xl font-bold text-orange-900">{orderStats.scheduled}</p>
                  </div>
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">In Progress</p>
                    <p className="text-2xl font-bold text-purple-900">{orderStats.inProgress}</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-900">{orderStats.completed}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by patient name, lab number, or physician..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2 border rounded-md"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="ordered">Ordered</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Skin Test Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-lg">Loading orders...</div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No orders match your search criteria.' 
                      : 'No skin test orders have been created yet.'
                    }
                  </p>
                  <Button onClick={() => setShowOrderForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Order
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {order.patient?.name || 'Unknown Patient'}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                Lab: {order.patient?.labno || 'N/A'}
                              </Badge>
                              <Badge className={getPriorityColor(order.priority)}>
                                {order.priority.toUpperCase()}
                              </Badge>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>Ordered by: {order.ordered_by}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Date: {new Date(order.order_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <TestTube className="h-4 w-4" />
                                <span>
                                  {order.test_panels.length} panels, {order.custom_allergens.length} custom
                                </span>
                              </div>
                            </div>

                            {order.instructions && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                  <strong>Instructions:</strong> {order.instructions}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Order
                            </Button>
                            {order.status === 'ordered' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, 'scheduled')}
                              >
                                Schedule Test
                              </Button>
                            )}
                            {order.status === 'scheduled' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, 'in_progress')}
                              >
                                Start Test
                              </Button>
                            )}
                            {order.status === 'in_progress' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                              >
                                Complete Test
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};