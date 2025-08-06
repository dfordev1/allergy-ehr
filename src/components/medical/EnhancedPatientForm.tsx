import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useRBAC, RESOURCES, PERMISSIONS } from '@/hooks/useRBAC';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Stethoscope,
  AlertTriangle,
  Plus,
  X,
  Save,
  FileText
} from 'lucide-react';

// Enhanced validation schema with medical-specific rules
const enhancedPatientSchema = z.object({
  // Basic Demographics
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  age: z.coerce.number().min(0).max(150, 'Invalid age'),
  sex: z.enum(['Male', 'Female', 'Other'], { required_error: 'Sex is required' }),
  
  // Contact Information
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().regex(/^[+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional().or(z.literal('')),
  emergencyContact: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional(),
  }),
  
  // Address
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('USA'),
  }),
  
  // Medical Information
  labNumber: z.string().min(1, 'Lab number is required'),
  mrn: z.string().optional(), // Medical Record Number
  insuranceNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  
  // Clinical Information
  referringPhysician: z.string().min(1, 'Referring physician is required'),
  primaryCarePhysician: z.string().optional(),
  provisionalDiagnosis: z.string().min(1, 'Provisional diagnosis is required'),
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  
  // Allergy History
  knownAllergies: z.array(z.object({
    allergen: z.string(),
    reaction: z.string(),
    severity: z.enum(['Mild', 'Moderate', 'Severe']),
  })),
  
  // Medical History
  medicalHistory: z.array(z.object({
    condition: z.string(),
    diagnosedDate: z.string().optional(),
    status: z.enum(['Active', 'Resolved', 'Chronic']),
  })),
  
  // Current Medications
  currentMedications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    startDate: z.string().optional(),
  })),
  
  // Family History
  familyHistory: z.object({
    allergies: z.boolean().default(false),
    asthma: z.boolean().default(false),
    eczema: z.boolean().default(false),
    other: z.string().optional(),
  }),
  
  // Social History
  socialHistory: z.object({
    smoking: z.enum(['Never', 'Former', 'Current']).default('Never'),
    alcohol: z.enum(['None', 'Occasional', 'Regular']).default('None'),
    occupation: z.string().optional(),
    pets: z.string().optional(),
  }),
  
  // Consent and Legal
  consentToTreatment: z.boolean().refine(val => val === true, 'Consent to treatment is required'),
  consentToShare: z.boolean().default(false),
  hipaaAcknowledgment: z.boolean().refine(val => val === true, 'HIPAA acknowledgment is required'),
  
  // Testing Information
  dateOfTesting: z.string().min(1, 'Date of testing is required'),
  testingNotes: z.string().optional(),
});

type EnhancedPatientFormData = z.infer<typeof enhancedPatientSchema>;

interface EnhancedPatientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<EnhancedPatientFormData>;
  mode?: 'create' | 'edit';
}

export const EnhancedPatientForm: React.FC<EnhancedPatientFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  mode = 'create'
}) => {
  const { logActivity } = useRBAC();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<EnhancedPatientFormData>({
    resolver: zodResolver(enhancedPatientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: 0,
      sex: 'Male',
      email: '',
      phone: '',
      emergencyContact: { name: '', relationship: '', phone: '' },
      address: { street: '', city: '', state: '', zipCode: '', country: 'USA' },
      labNumber: '',
      mrn: '',
      insuranceNumber: '',
      insuranceProvider: '',
      referringPhysician: '',
      primaryCarePhysician: '',
      provisionalDiagnosis: '',
      chiefComplaint: '',
      historyOfPresentIllness: '',
      knownAllergies: [],
      medicalHistory: [],
      currentMedications: [],
      familyHistory: {
        allergies: false,
        asthma: false,
        eczema: false,
        other: '',
      },
      socialHistory: {
        smoking: 'Never',
        alcohol: 'None',
        occupation: '',
        pets: '',
      },
      consentToTreatment: false,
      consentToShare: false,
      hipaaAcknowledgment: false,
      dateOfTesting: new Date().toISOString().split('T')[0],
      testingNotes: '',
      ...initialData,
    },
  });

  // Field arrays for dynamic sections
  const { fields: allergyFields, append: appendAllergy, remove: removeAllergy } = useFieldArray({
    control: form.control,
    name: 'knownAllergies',
  });

  const { fields: medicalHistoryFields, append: appendMedicalHistory, remove: removeMedicalHistory } = useFieldArray({
    control: form.control,
    name: 'medicalHistory',
  });

  const { fields: medicationFields, append: appendMedication, remove: removeMedication } = useFieldArray({
    control: form.control,
    name: 'currentMedications',
  });

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const onSubmit = async (data: EnhancedPatientFormData) => {
    setLoading(true);
    try {
      // Prepare patient data for database
      const patientData = {
        name: `${data.firstName} ${data.lastName}`,
        age: data.age,
        sex: data.sex,
        labno: data.labNumber,
        dateoftesting: data.dateOfTesting,
        provisionaldiagnosis: data.provisionalDiagnosis,
        referringphysician: data.referringPhysician,
        contactinfo: {
          email: data.email,
          phone: data.phone,
          emergencyContact: data.emergencyContact,
          address: data.address,
          insurance: {
            number: data.insuranceNumber,
            provider: data.insuranceProvider,
          },
        },
        // Extended medical data
        medical_data: {
          mrn: data.mrn,
          primaryCarePhysician: data.primaryCarePhysician,
          chiefComplaint: data.chiefComplaint,
          historyOfPresentIllness: data.historyOfPresentIllness,
          knownAllergies: data.knownAllergies,
          medicalHistory: data.medicalHistory,
          currentMedications: data.currentMedications,
          familyHistory: data.familyHistory,
          socialHistory: data.socialHistory,
          consent: {
            treatment: data.consentToTreatment,
            share: data.consentToShare,
            hipaa: data.hipaaAcknowledgment,
          },
          testingNotes: data.testingNotes,
        },
      };

      const { error } = await supabase
        .from('patients')
        .insert([patientData]);

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Error saving patient: ' + error.message);
        return;
      }

      await logActivity(
        mode === 'create' ? 'create' : 'update',
        'patient',
        undefined,
        { patient_name: `${data.firstName} ${data.lastName}` }
      );

      toast.success(`Patient ${mode === 'create' ? 'created' : 'updated'} successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error ${mode === 'create' ? 'creating' : 'updating'} patient`);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Demographics', icon: User },
    { id: 2, title: 'Contact & Insurance', icon: Phone },
    { id: 3, title: 'Medical History', icon: Stethoscope },
    { id: 4, title: 'Current Medications', icon: FileText },
    { id: 5, title: 'Consent & Testing', icon: AlertTriangle },
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter first name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter last name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const age = calculateAge(e.target.value);
                          form.setValue('age', age);
                        }}
                      />
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
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} readOnly />
                    </FormControl>
                    <FormDescription>Calculated from date of birth</FormDescription>
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
                name="labNumber"
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
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="patient@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1 (555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Emergency contact name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContact.relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Spouse, Parent, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContact.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1 (555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Insurance Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Insurance Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="insuranceProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Provider</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Insurance company name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Policy/Member ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Clinical Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Clinical Information</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="referringPhysician"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referring Physician *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Dr. Smith" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="provisionalDiagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provisional Diagnosis *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter provisional diagnosis" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chiefComplaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chief Complaint</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Patient's main concern or symptoms" rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Known Allergies */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Known Allergies</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendAllergy({ allergen: '', reaction: '', severity: 'Mild' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Allergy
                </Button>
              </div>
              
              <div className="space-y-3">
                {allergyFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                    <FormField
                      control={form.control}
                      name={`knownAllergies.${index}.allergen`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergen</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Peanuts, Dust, etc." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`knownAllergies.${index}.reaction`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reaction</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Hives, swelling, etc." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`knownAllergies.${index}.severity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Severity</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mild">Mild</SelectItem>
                              <SelectItem value="Moderate">Moderate</SelectItem>
                              <SelectItem value="Severe">Severe</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAllergy(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Current Medications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Current Medications</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendMedication({ name: '', dosage: '', frequency: '', startDate: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>
              
              <div className="space-y-3">
                {medicationFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg">
                    <FormField
                      control={form.control}
                      name={`currentMedications.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medication</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Medication name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`currentMedications.${index}.dosage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dosage</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="10mg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`currentMedications.${index}.frequency`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Twice daily" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`currentMedications.${index}.startDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMedication(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Family History */}
            <div>
              <h3 className="text-lg font-medium mb-4">Family History</h3>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="familyHistory.allergies"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Family history of allergies</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="familyHistory.asthma"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Family history of asthma</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="familyHistory.eczema"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Family history of eczema</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* Testing Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Testing Information</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="dateOfTesting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Testing *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="testingNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Testing Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Any special notes for testing" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Consent Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Consent & Legal Requirements
              </h3>
              
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <FormField
                  control={form.control}
                  name="consentToTreatment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Consent to Treatment *
                        </FormLabel>
                        <FormDescription>
                          I consent to receive allergy testing and related medical treatment.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hipaaAcknowledgment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          HIPAA Acknowledgment *
                        </FormLabel>
                        <FormDescription>
                          I acknowledge receipt of the Notice of Privacy Practices.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consentToShare"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Consent to Share Information
                        </FormLabel>
                        <FormDescription>
                          I consent to sharing my test results with my referring physician.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{mode === 'create' ? 'New Patient Registration' : 'Edit Patient Information'}</span>
          <Badge variant="outline">
            Step {currentStep} of {steps.length}
          </Badge>
        </CardTitle>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mt-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                    'border-muted-foreground text-muted-foreground'}
                `}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="ml-2 hidden sm:block">
                  <div className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <div>
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                
                {currentStep < steps.length ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : mode === 'create' ? 'Create Patient' : 'Update Patient'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};