import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRBAC, RESOURCES, PERMISSIONS } from '@/hooks/useRBAC';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Calendar, User, Stethoscope, TestTube, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { AllergyTestTable } from '@/components/patients/AllergyTestTable';
import { AddTestForm } from '@/components/tests/AddTestForm';
import { EnhancedAllergyTestForm } from '@/components/tests/EnhancedAllergyTestForm';
import { EditPatientForm } from '@/components/patients/EditPatientForm';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Patient {
  id: string;
  name: string;
  age: number;
  sex: string;
  labno: string;
  dateoftesting: string;
  provisionaldiagnosis: string;
  referringphysician: string;
  createdat: string;
}

export const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useRBAC();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [showAddTest, setShowAddTest] = useState(false);
  const [showEnhancedTest, setShowEnhancedTest] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Error fetching patient details');
        navigate('/');
        return;
      }

      setPatient(data);
    } catch (error) {
      toast.error('Error fetching patient details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAdded = () => {
    setShowAddTest(false);
  };

  const handleEnhancedTestAdded = () => {
    setShowEnhancedTest(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading patient details...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Patient not found</h2>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex space-x-2">
              <PermissionGuard resource={RESOURCES.PATIENTS} action={PERMISSIONS.PATIENTS.UPDATE}>
                <Button onClick={() => setShowEditPatient(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Patient
                </Button>
              </PermissionGuard>
              <PermissionGuard resource={RESOURCES.TESTS} action={PERMISSIONS.TESTS.CREATE}>
                <Button onClick={() => setShowAddTest(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test Session
                </Button>
              </PermissionGuard>
              <PermissionGuard resource={RESOURCES.TESTS} action={PERMISSIONS.TESTS.CREATE}>
                <Button onClick={() => setShowEnhancedTest(true)} variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  Enhanced Allergy Test
                </Button>
              </PermissionGuard>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{patient.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{patient.age}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sex</p>
                  <p className="font-medium">{patient.sex}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lab Number</p>
                  <p className="font-medium">{patient.labno}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Testing</p>
                  <p className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(patient.dateoftesting).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Referring Physician</p>
                  <p className="font-medium flex items-center">
                    <Stethoscope className="h-4 w-4 mr-1" />
                    {patient.referringphysician}
                  </p>
                </div>
                <div className="md:col-span-2 lg:col-span-1">
                  <p className="text-sm text-muted-foreground">Provisional Diagnosis</p>
                  <p className="font-medium">{patient.provisionaldiagnosis}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {showEditPatient ? (
            <EditPatientForm
              patient={patient}
              onSuccess={() => {
                setShowEditPatient(false);
                fetchPatient(); // Refresh patient data
              }}
              onCancel={() => setShowEditPatient(false)}
            />
          ) : showAddTest ? (
            <AddTestForm
              patientId={patient.id}
              onSuccess={handleTestAdded}
              onCancel={() => setShowAddTest(false)}
            />
          ) : showEnhancedTest ? (
            <EnhancedAllergyTestForm
              patientId={patient.id}
              patientName={patient.name}
              onSuccess={handleEnhancedTestAdded}
              onCancel={() => setShowEnhancedTest(false)}
            />
          ) : (
            <Tabs defaultValue="tests" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tests">Test Sessions</TabsTrigger>
                <TabsTrigger value="enhanced">Enhanced Tests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tests">
                <AllergyTestTable 
                  patientId={patient.id} 
                  onAddTest={() => setShowAddTest(true)}
                />
              </TabsContent>
              
              <TabsContent value="enhanced">
                <Card>
                  <CardContent className="p-6 text-center">
                    <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Enhanced Allergy Tests</h3>
                    <p className="text-muted-foreground mb-4">
                      Create comprehensive allergy tests with 43 predefined allergens
                    </p>
                    <Button onClick={() => setShowEnhancedTest(true)}>
                      <TestTube className="h-4 w-4 mr-2" />
                      Create Enhanced Test
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};