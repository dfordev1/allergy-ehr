import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRBAC, RESOURCES, PERMISSIONS } from '@/hooks/useRBAC';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Calendar, User, Stethoscope, TestTube, Edit, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { AllergyTestTable } from '@/components/patients/AllergyTestTable';
import { AddTestForm } from '@/components/tests/AddTestForm';
import { EnhancedAllergyTestForm } from '@/components/tests/EnhancedAllergyTestForm';
import { EnhancedTestList } from '@/components/tests/EnhancedTestList';
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

  // Function to export saved enhanced test data to PDF
  const exportEnhancedTestToPDF = async (testId: string) => {
    try {
      const { data: testData, error } = await supabase
        .from('enhanced_allergy_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) {
        toast.error('Failed to fetch test data');
        return;
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Enhanced Allergy Test Report', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
      
      // Patient Information
      let yPos = 50;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Patient Information', 20, yPos);
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const patientInfo = testData.patient_info || {};
      pdf.text(`Name: ${patientInfo.name || patient?.name || 'N/A'}`, 20, yPos);
      pdf.text(`Lab No: ${patientInfo.lab_no || patient?.labno || 'N/A'}`, 120, yPos);
      
      yPos += 7;
      pdf.text(`Age/Sex: ${patientInfo.age_sex || `${patient?.age}/${patient?.sex}` || 'N/A'}`, 20, yPos);
      pdf.text(`Test Date: ${testData.test_date || 'N/A'}`, 120, yPos);
      
      yPos += 7;
      pdf.text(`Provisional Diagnosis: ${patientInfo.provisional_diagnosis || patient?.provisionaldiagnosis || 'N/A'}`, 20, yPos);
      
      yPos += 7;
      pdf.text(`Referred By: ${patientInfo.referred_by || patient?.referringphysician || 'N/A'}`, 20, yPos);
      
      // Allergen Results
      yPos += 15;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Allergen Test Results', 20, yPos);
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const allergenResults = testData.allergen_results || {};
      let resultCount = 0;
      
      for (const [allergenKey, result] of Object.entries(allergenResults)) {
        if (result && result !== '0mm') {
          yPos += 5;
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
          
          const allergenName = allergenKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const whealSize = result as string;
          const numericSize = parseFloat(whealSize.replace('mm', ''));
          const testResult = numericSize >= 3 ? 'POSITIVE' : 'NEGATIVE';
          
          const resultColor = testResult === 'POSITIVE' ? [255, 0, 0] : [0, 128, 0];
          
          pdf.text(`${allergenName}:`, 25, yPos);
          pdf.text(`${whealSize}`, 120, yPos);
          
          pdf.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
          pdf.text(testResult, 150, yPos);
          pdf.setTextColor(0, 0, 0);
          
          resultCount++;
        }
      }
      
      if (resultCount === 0) {
        pdf.text('No test results recorded', 25, yPos);
      }
      
      // Additional Information
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = 20;
      }
      
      yPos += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Additional Information', 20, yPos);
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Technician: ${testData.technician || 'N/A'}`, 20, yPos);
      
      if (testData.notes) {
        yPos += 7;
        pdf.text('Notes:', 20, yPos);
        yPos += 5;
        const splitNotes = pdf.splitTextToSize(testData.notes, pageWidth - 40);
        pdf.text(splitNotes, 20, yPos);
      }
      
      // Save PDF
      const fileName = `allergy-test-${patient?.name?.replace(/\s+/g, '-') || 'patient'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('Test data exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting test PDF:', error);
      toast.error('Failed to export test data to PDF');
    }
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
              
              <TabsContent value="enhanced" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Enhanced Allergy Tests</h3>
                  <Button onClick={() => setShowEnhancedTest(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Enhanced Test
                  </Button>
                </div>
                
                <EnhancedTestList 
                  patientId={patient.id}
                  patientName={patient.name}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};