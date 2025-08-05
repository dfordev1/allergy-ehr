import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const bookingSchema = z.object({
  patient_id: z.string().min(1, 'Please select a patient'),
  booking_date: z.string().min(1, 'Booking date is required'),
  booking_time: z.string().min(1, 'Booking time is required'),
  test_type: z.string().min(1, 'Test type is required'),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface Patient {
  id: string;
  name: string;
}

interface AddBookingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddBookingForm = ({ onSuccess, onCancel }: AddBookingFormProps) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name')
        .order('name');

      if (error) {
        toast.error('Error fetching patients');
        return;
      }

      setPatients(data || []);
    } catch (error) {
      toast.error('Error fetching patients');
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    setLoading(true);
    try {
      // Get patient name for the booking
      const patient = patients.find(p => p.id === data.patient_id);
      if (!patient) {
        toast.error('Patient not found');
        return;
      }

      // Insert booking into Supabase
      const { error } = await supabase
        .from('bookings')
        .insert({
          patient_id: data.patient_id,
          patient_name: patient.name,
          booking_date: data.booking_date,
          booking_time: data.booking_time,
          test_type: data.test_type,
          notes: data.notes || null,
          status: 'scheduled',
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Error creating booking: ' + error.message);
        return;
      }

      toast.success('Booking created successfully!');
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  const testTypes = [
    'Skin Prick Test',
    'Intradermal Test',
    'Patch Test',
    'Food Allergy Panel',
    'Environmental Allergy Panel',
    'Drug Allergy Test',
    'Insect Venom Test',
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Schedule New Allergy Test</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_id">Patient</Label>
              <Select onValueChange={(value) => setValue('patient_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patient_id && (
                <p className="text-sm text-destructive">{errors.patient_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="test_type">Test Type</Label>
              <Select onValueChange={(value) => setValue('test_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.test_type && (
                <p className="text-sm text-destructive">{errors.test_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking_date">Date</Label>
              <Input
                id="booking_date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('booking_date')}
              />
              {errors.booking_date && (
                <p className="text-sm text-destructive">{errors.booking_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking_time">Time</Label>
              <Input
                id="booking_time"
                type="time"
                {...register('booking_time')}
              />
              {errors.booking_time && (
                <p className="text-sm text-destructive">{errors.booking_time.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or notes for this booking"
              {...register('notes')}
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Booking'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};