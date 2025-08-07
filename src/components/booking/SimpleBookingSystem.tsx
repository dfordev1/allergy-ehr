import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, Plus, Trash2, Edit, Search, Filter, Phone, Mail, MapPin, Activity, CheckCircle, XCircle, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';


interface Booking {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  appointment_date: string;
  appointment_time: string;
  test_type: string;
  status: string;
  priority: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface NewBooking {
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  appointment_date: string;
  appointment_time: string;
  test_type: string;
  priority: string;
  notes?: string;
}

export const SimpleBookingSystem = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState<NewBooking>({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    appointment_date: '',
    appointment_time: '',
    test_type: '',
    priority: 'normal',
    notes: ''
  });

  const testTypes = [
    { value: 'Skin Prick Test', description: 'Quick allergy skin testing' },
    { value: 'Patch Test', description: 'Delayed reaction testing' },
    { value: 'Food Allergy Test', description: 'Comprehensive food allergy panel' },
    { value: 'Environmental Allergy Test', description: 'Environmental allergen testing' },
    { value: 'Drug Allergy Test', description: 'Medication allergy assessment' },
    { value: 'Insect Venom Test', description: 'Insect sting allergy testing' },
    { value: 'Comprehensive Panel', description: 'Full allergy assessment' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  // Create bookings table if it doesn't exist
  const initializeTable = async () => {
    try {
      const { error } = await supabase.rpc('create_simple_bookings_table');
      if (error && !error.message.includes('already exists')) {
        console.log('Table creation info:', error.message);
      }
    } catch (error) {
      // Table might already exist, which is fine
      console.log('Table initialization:', error);
    }
  };

  // Load bookings
  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // First try to create table
      await initializeTable();
      
      const { data, error } = await supabase
        .from('simple_bookings')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Error loading bookings:', error);
        toast.error('Could not load bookings: ' + error.message);
        return;
      }

      setBookings(data || []);
      setFilteredBookings(data || []);
      toast.success(`Loaded ${data?.length || 0} bookings`);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on search and filters
  useEffect(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.patient_phone.includes(searchTerm) ||
        booking.test_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.notes && booking.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(booking => booking.appointment_date === todayStr);
          break;
        case 'week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(booking => 
            booking.appointment_date >= todayStr && 
            booking.appointment_date <= weekFromNow.toISOString().split('T')[0]
          );
          break;
        case 'month':
          const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(booking => 
            booking.appointment_date >= todayStr && 
            booking.appointment_date <= monthFromNow.toISOString().split('T')[0]
          );
          break;
      }
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  // Create new booking
  const createBooking = async () => {
    try {
      if (!formData.patient_name || !formData.appointment_date || !formData.appointment_time || !formData.test_type) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Create booking data with only the core required fields that exist in the basic table
      const bookingData = {
        patient_name: formData.patient_name,
        patient_phone: formData.patient_phone || '',
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        test_type: formData.test_type,
        status: 'scheduled',
        notes: formData.notes || ''
      };

      // Only add optional fields if they have values and if the database supports them
      if (formData.patient_email && formData.patient_email.trim()) {
        try {
          (bookingData as any).patient_email = formData.patient_email;
        } catch (e) {
          console.log('patient_email field not supported in database');
        }
      }
      
      if (formData.priority && formData.priority !== 'normal') {
        try {
          (bookingData as any).priority = formData.priority;
        } catch (e) {
          console.log('priority field not supported in database');
        }
      }

      const { data, error } = await supabase
        .from('simple_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        // Provide more helpful error message
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          toast.error('Database needs to be updated. Please run the database migration script.');
        } else {
          toast.error('Failed to create booking: ' + error.message);
        }
        return;
      }

      setBookings(prev => [...prev, data]);
      resetForm();
      toast.success('Booking created successfully!');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to create booking');
    }
  };

  // Update booking
  const updateBooking = async () => {
    try {
      if (!editingBooking) return;

      const { data, error } = await supabase
        .from('simple_bookings')
        .update(formData)
        .eq('id', editingBooking.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating booking:', error);
        toast.error('Failed to update booking: ' + error.message);
        return;
      }

      setBookings(prev => prev.map(b => b.id === editingBooking.id ? data : b));
      resetForm();
      toast.success('Booking updated successfully!');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to update booking');
    }
  };

  // Delete booking
  const deleteBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('simple_bookings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting booking:', error);
        toast.error('Failed to delete booking: ' + error.message);
        return;
      }

      setBookings(prev => prev.filter(b => b.id !== id));
      toast.success('Booking deleted successfully!');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to delete booking');
    }
  };

  // Form helpers
  const resetForm = () => {
    setFormData({
      patient_name: '',
      patient_phone: '',
      patient_email: '',
      appointment_date: '',
      appointment_time: '',
      test_type: '',
      priority: 'normal',
      notes: ''
    });
    setShowForm(false);
    setEditingBooking(null);
  };

  const startEdit = (booking: Booking) => {
    setFormData({
      patient_name: booking.patient_name,
      patient_phone: booking.patient_phone,
      patient_email: booking.patient_email || '',
      appointment_date: booking.appointment_date,
      appointment_time: booking.appointment_time,
      test_type: booking.test_type,
      priority: booking.priority || 'normal',
      notes: booking.notes || ''
    });
    setEditingBooking(booking);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Load bookings on component mount
  useEffect(() => {
    loadBookings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading booking system...</div>
      </div>
    );
  }

  // Get statistics
  const totalBookings = bookings.length;
  const scheduledBookings = bookings.filter(b => b.status === 'scheduled').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const todayBookings = bookings.filter(b => b.appointment_date === new Date().toISOString().split('T')[0]).length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Appointment Bookings</h1>
          <p className="text-gray-600 mt-1">Comprehensive patient appointment and allergy testing management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => loadBookings()} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowForm(true)} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{scheduledBookings}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedBookings}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-orange-600">{todayBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search patients, phone, test type, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Booking Form */}
      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-900 flex items-center gap-2">
              {editingBooking ? (
                <>
                  <Edit className="h-5 w-5" />
                  Edit Appointment
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Schedule New Appointment
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Patient Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="patient_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Patient Name *
                  </Label>
                  <Input
                    id="patient_name"
                    value={formData.patient_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, patient_name: e.target.value }))}
                    placeholder="Enter full patient name"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patient_phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="patient_phone"
                    value={formData.patient_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, patient_phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patient_email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="patient_email"
                    type="email"
                    value={formData.patient_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, patient_email: e.target.value }))}
                    placeholder="patient@example.com"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Appointment Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointment_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date *
                    </Label>
                    <Input
                      id="appointment_date"
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="appointment_time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time *
                    </Label>
                    <Input
                      id="appointment_time"
                      type="time"
                      value={formData.appointment_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, appointment_time: e.target.value }))}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test_type">Test Type *</Label>
                  <Select 
                    value={formData.test_type} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        test_type: value
                      }));
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      {testTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.value}</span>
                            <span className="text-xs text-gray-500">{type.description} • {type.duration} min</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${priority.color}`}></div>
                              {priority.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  

                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-6 space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special instructions, allergies, or notes about this appointment..."
                rows={3}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            
            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t">
              <Button 
                onClick={editingBooking ? updateBooking : createBooking}
                className="flex items-center justify-center gap-2 flex-1"
                size="lg"
              >
                {editingBooking ? (
                  <>
                    <Edit className="h-4 w-4" />
                    Update Appointment
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Schedule Appointment
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="flex items-center justify-center gap-2 flex-1"
                size="lg"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Bookings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Appointments ({filteredBookings.length} of {bookings.length})
          </h2>
        </div>
        
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {bookings.length === 0 ? 'No appointments scheduled' : 'No appointments match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {bookings.length === 0 
                  ? 'Create your first appointment to get started with patient scheduling'
                  : 'Try adjusting your search or filter criteria to find appointments'
                }
              </p>
              {bookings.length === 0 && (
                <Button onClick={() => setShowForm(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule First Appointment
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const priorityLevel = priorityLevels.find(p => p.value === booking.priority);
              const testType = testTypes.find(t => t.value === booking.test_type);
              
              return (
                <Card key={booking.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{booking.patient_name}</h3>
                            {booking.patient_phone && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {booking.patient_phone}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {priorityLevel && (
                          <Badge className={priorityLevel.color}>
                            {priorityLevel.label} Priority
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(booking.status)} variant="secondary">
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(booking)}
                          className="hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBooking(booking.id)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Appointment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Date</p>
                          <p className="text-sm text-gray-600">{new Date(booking.appointment_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Time</p>
                          <p className="text-sm text-gray-600">{booking.appointment_time}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Activity className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Test Type</p>
                          <p className="text-sm text-gray-600">{booking.test_type}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Information */}
                    {(booking.patient_email || booking.notes) && (
                      <div className="border-t pt-4 space-y-2">
                        {booking.patient_email && (
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {booking.patient_email}
                          </p>
                        )}
                        {booking.notes && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 mb-1">Notes:</p>
                            <p className="text-sm text-gray-700">{booking.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

