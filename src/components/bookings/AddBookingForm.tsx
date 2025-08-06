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
import { bookingApi, patientApi } from '@/services/api';
import { toast } from 'sonner';

const bookingSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  appointmentTime: z.string().min(1, 'Appointment time is required'),
  testType: z.string().min(1, 'Test type is required'),
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
      const result = await patientApi.getAll();
      
      if (!result.success) {
        toast.error('Error fetching patients: ' + (result.error?.message || 'Unknown error'));
        return;
      }

      // Handle both paginated and direct array responses
      const patientData = result.data?.data || result.data || [];
      const patientList = patientData.map((patient: any) => ({
        id: patient.id,
        name: patient.name
      }));
      
      setPatients(patientList);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Error fetching patients');
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    setLoading(true);
    try {
      // Get patient name for the booking
      const patient = patients.find(p => p.id === data.patientId);
      if (!patient) {
        toast.error('Patient not found');
        return;
      }

      // Create booking with simpler approach to avoid conflicts
      const bookingData = {
        patientId: data.patientId,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        testType: data.testType,
        notes: data.notes || '',
        durationMinutes: 60
      };

      const result = await bookingApi.create(bookingData);

      if (!result.success) {
        console.error('API error:', result.error);
        toast.error('Error creating booking: ' + (result.error?.message || 'Unknown error'));
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg md:text-xl">Schedule New Allergy Test</CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient</Label>
              <Select onValueChange={(value) => setValue('patientId', value)}>
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
              {errors.patientId && (
                <p className="text-sm text-destructive">{errors.patientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="testType">Test Type</Label>
              <Select onValueChange={(value) => setValue('testType', value)}>
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
              {errors.testType && (
                <p className="text-sm text-destructive">{errors.testType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Date</Label>
              <Input
                id="appointmentDate"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('appointmentDate')}
              />
              {errors.appointmentDate && (
                <p className="text-sm text-destructive">{errors.appointmentDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentTime">Time</Label>
              <Input
                id="appointmentTime"
                type="time"
                {...register('appointmentTime')}
              />
              {errors.appointmentTime && (
                <p className="text-sm text-destructive">{errors.appointmentTime.message}</p>
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