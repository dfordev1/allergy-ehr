import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { PatientListV2 as PatientList } from '@/components/patients/PatientListV2';
import { AddPatientForm } from '@/components/patients/AddPatientForm';
import { AdvancedPatientSearch } from '@/components/patients/AdvancedPatientSearch';
import { ClinicOverview } from '@/components/medical/ClinicOverview';
import { MedicalComplianceCard } from '@/components/medical/MedicalComplianceCard';
import { DatabaseConnectionTest } from '@/components/debug/DatabaseConnectionTest';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useRBAC, RESOURCES, PERMISSIONS } from '@/hooks/useRBAC';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { hasPermission, userProfile, role } = useRBAC();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('patients'); // Default to patients tab
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddSuccess = () => {
    setShowAddForm(false);
    setRefreshKey(prev => prev + 1); // Trigger refresh instead of page reload
    toast.success('Patient added successfully!');
  };

  const handlePatientSelect = (patient: any) => {
    navigate(`/patient/${patient.id}`);
  };

  const handleBulkAction = (action: string, patientIds: string[]) => {
    console.log(`Bulk action: ${action} for patients:`, patientIds);
    toast.info(`Bulk action: ${action} for ${patientIds.length} patients`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-4 md:py-8">
        {showAddForm ? (
          <div className="max-w-4xl mx-auto">
            <AddPatientForm
              onSuccess={handleAddSuccess}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
            {/* Mobile: Scrollable tabs */}
            <div className="md:hidden">
              <TabsList className="grid grid-cols-2 w-full mb-2">
                <TabsTrigger value="patients" className="text-xs">Patients</TabsTrigger>
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              </TabsList>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="advanced" className="text-xs">Search</TabsTrigger>
                <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
                <TabsTrigger value="debug" className="text-xs">Debug</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Desktop: Single row tabs */}
            <TabsList className="hidden md:grid w-full grid-cols-5">
              <TabsTrigger value="patients">Patient Records</TabsTrigger>
              <TabsTrigger value="overview">Clinic Overview</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Search</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="debug">Debug</TabsTrigger>
            </TabsList>
            
            <TabsContent value="patients">
              <PatientList 
                key={refreshKey} 
                onAddPatient={() => setShowAddForm(true)} 
              />
            </TabsContent>
            
            <TabsContent value="overview">
              <ClinicOverview />
            </TabsContent>
            
            <TabsContent value="advanced">
              <AdvancedPatientSearch 
                onPatientSelect={handlePatientSelect}
                onBulkAction={handleBulkAction}
              />
            </TabsContent>

            <TabsContent value="compliance">
              <MedicalComplianceCard />
            </TabsContent>

            <TabsContent value="debug">
              <DatabaseConnectionTest />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};