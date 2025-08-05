import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

const patientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0, 'Age must be positive').max(150, 'Age must be realistic'),
  sex: z.enum(['Male', 'Female', 'Other']),
  labno: z.string().min(1, 'Lab number is required'),
  dateoftesting: z.string().min(1, 'Date of testing is required'),
  provisionaldiagnosis: z.string().min(1, 'Provisional diagnosis is required'),
  referringphysician: z.string().min(1, 'Referring physician is required'),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface AddPatientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddPatientForm = ({ onSuccess, onCancel }: AddPatientFormProps) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      console.log('Adding patient:', data);
      const { error } = await supabase
        .from('patients')
        .insert([
          {
            name: data.name,
            age: data.age,
            sex: data.sex,
            labno: data.labno,
            dateoftesting: data.dateoftesting,
            provisionaldiagnosis: data.provisionaldiagnosis,
            referringphysician: data.referringphysician,
            contactinfo: {},
          },
        ]);

      if (error) {
        console.error('Supabase error:', error);
        toast.error(`Error adding patient: ${error.message}`);
        return;
      }

      console.log('Patient added successfully');
      toast.success('Patient added successfully!');
      reset();
      onSuccess();
    } catch (error) {
      console.error('Add patient error:', error);
      toast.error(`Error adding patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Patient</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter patient's full name"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter age"
                {...register('age', { valueAsNumber: true })}
              />
              {errors.age && (
                <p className="text-sm text-destructive">{errors.age.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select onValueChange={(value) => setValue('sex', value as 'Male' | 'Female' | 'Other')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.sex && (
                <p className="text-sm text-destructive">{errors.sex.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="labno">Lab Number</Label>
              <Input
                id="labno"
                placeholder="Enter lab number"
                {...register('labno')}
              />
              {errors.labno && (
                <p className="text-sm text-destructive">{errors.labno.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateoftesting">Date of Testing</Label>
              <Input
                id="dateoftesting"
                type="date"
                {...register('dateoftesting')}
              />
              {errors.dateoftesting && (
                <p className="text-sm text-destructive">{errors.dateoftesting.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referringphysician">Referring Physician</Label>
              <Input
                id="referringphysician"
                placeholder="Enter referring physician"
                {...register('referringphysician')}
              />
              {errors.referringphysician && (
                <p className="text-sm text-destructive">{errors.referringphysician.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provisionaldiagnosis">Provisional Diagnosis</Label>
            <Input
              id="provisionaldiagnosis"
              placeholder="Enter provisional diagnosis"
              {...register('provisionaldiagnosis')}
            />
            {errors.provisionaldiagnosis && (
              <p className="text-sm text-destructive">{errors.provisionaldiagnosis.message}</p>
            )}
          </div>

          <div className="flex space-x-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Adding...' : 'Add Patient'}
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