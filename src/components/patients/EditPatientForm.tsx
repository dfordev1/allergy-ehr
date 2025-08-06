import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useRBAC, RESOURCES, PERMISSIONS } from '@/hooks/useRBAC';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Badge } from '@/components/ui/badge';

import { Save, X, Edit, Lock } from 'lucide-react';

type Patient = Database['public']['Tables']['patients']['Row'];

const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.coerce.number().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120'),
  sex: z.string().min(1, 'Sex is required'),
  labno: z.string().min(3, 'Lab number must be at least 3 characters'),
  dateoftesting: z.string().min(1, 'Date of testing is required'),
  provisionaldiagnosis: z.string().min(3, 'Provisional diagnosis must be at least 3 characters'),
  referringphysician: z.string().min(2, 'Referring physician must be at least 2 characters'),
  contactinfo: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface EditPatientFormProps {
  patient: Patient;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditPatientForm: React.FC<EditPatientFormProps> = ({
  patient,
  onSuccess,
  onCancel,
}) => {
  const { hasPermission, checkPermission, logActivity } = useRBAC();
  const [loading, setLoading] = useState(false);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient.name,
      age: patient.age,
      sex: patient.sex,
      labno: patient.labno,
      dateoftesting: patient.dateoftesting,
      provisionaldiagnosis: patient.provisionaldiagnosis,
      referringphysician: patient.referringphysician,
      contactinfo: typeof patient.contactinfo === 'string' 
        ? patient.contactinfo 
        : JSON.stringify(patient.contactinfo || ''),
    },
  });

  const canEdit = hasPermission(RESOURCES.PATIENTS, PERMISSIONS.PATIENTS.UPDATE);

  const onSubmit = async (data: PatientFormData) => {
    if (!checkPermission(RESOURCES.PATIENTS, PERMISSIONS.PATIENTS.UPDATE)) {
      return;
    }

    setLoading(true);
    try {
      let contactInfo = null;
      if (data.contactinfo) {
        try {
          contactInfo = JSON.parse(data.contactinfo);
        } catch {
          contactInfo = data.contactinfo;
        }
      }

      const { error } = await supabase
        .from('patients')
        .update({
          name: data.name,
          age: data.age,
          sex: data.sex,
          labno: data.labno,
          dateoftesting: data.dateoftesting,
          provisionaldiagnosis: data.provisionaldiagnosis,
          referringphysician: data.referringphysician,
          contactinfo: contactInfo,
          updatedat: new Date().toISOString(),
        })
        .eq('id', patient.id);

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Error updating patient: ' + error.message);
        return;
      }

      await logActivity('update', 'patient', patient.id, {
        patient_name: data.name,
        changes: Object.keys(data),
      });

      toast.success('Patient updated successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error updating patient');
    } finally {
      setLoading(false);
    }
  };

  const ReadOnlyField: React.FC<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }> = ({ label, value, icon }) => (
    <div className="space-y-2">
      <Label className="flex items-center space-x-2">
        {icon}
        <span>{label}</span>
        <Lock className="h-3 w-3 text-muted-foreground" />
      </Label>
      <div className="p-2 border rounded-md bg-muted/50 text-muted-foreground">
        {value}
      </div>
    </div>
  );

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Patient Details</span>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Lock className="h-3 w-3" />
              <span>Read Only</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Name" value={patient.name} />
            <ReadOnlyField label="Age" value={patient.age} />
            <ReadOnlyField label="Sex" value={patient.sex} />
            <ReadOnlyField label="Lab Number" value={patient.labno} />
            <ReadOnlyField label="Date of Testing" value={patient.dateoftesting} />
            <ReadOnlyField label="Provisional Diagnosis" value={patient.provisionaldiagnosis} />
            <ReadOnlyField label="Referring Physician" value={patient.referringphysician} />
          </div>
          {patient.contactinfo && (
            <ReadOnlyField 
              label="Contact Information" 
              value={typeof patient.contactinfo === 'string' 
                ? patient.contactinfo 
                : JSON.stringify(patient.contactinfo)
              } 
            />
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Edit Patient</span>
          </span>
          <Badge variant="default" className="flex items-center space-x-1">
            <Edit className="h-3 w-3" />
            <span>Editable</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter patient name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        placeholder="Enter age"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab Number *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter lab number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateoftesting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Testing *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referringphysician"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referring Physician *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter referring physician" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="provisionaldiagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provisional Diagnosis *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter provisional diagnosis"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactinfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Information</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter contact information (JSON format or plain text)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};