import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { AddBookingForm } from '@/components/bookings/AddBookingForm';

interface Booking {
  id: string;
  patient_name: string;
  patient_id: string;
  booking_date: string;
  booking_time: string;
  test_type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export const BookingPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Error fetching bookings: ' + error.message);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAdded = () => {
    setShowAddForm(false);
    fetchBookings();
  };

  const filteredBookings = bookings.filter(booking =>
    booking.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.test_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        {showAddForm ? (
          <AddBookingForm
            onSuccess={handleBookingAdded}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Allergy Test Bookings</h2>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings by patient name or test type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>{booking.patient_name}</span>
                      </CardTitle>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.booking_time}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Test Type: </span>
                        <span className="font-medium">{booking.test_type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Booked: </span>
                        <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {booking.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">Notes: {booking.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredBookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No bookings found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No bookings match your search.' : 'No allergy test bookings scheduled yet.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule First Booking
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};