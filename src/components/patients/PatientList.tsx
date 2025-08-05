import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks/useApi';
import { ComponentErrorBoundary } from '@/components/errors/ErrorBoundary';
import { PatientSearchFilters } from '@/types/medical';

interface Patient {
  id: string;
  name: string;
  age: number;
  sex: string;
  createdat: string;
}

interface PatientListProps {
  onAddPatient: () => void;
}

export const PatientList = ({ onAddPatient }: PatientListProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients...');
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        toast.error(`Error fetching patients: ${error.message}`);
        return;
      }

      console.log('Patients fetched:', data?.length || 0);
      setPatients(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(`Error fetching patients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientClick = (patientId: string) => {
    navigate(`/patient/${patientId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Patients</h2>
        <Button onClick={onAddPatient}>
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((patient) => (
          <Card
            key={patient.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handlePatientClick(patient.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{patient.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Age: {patient.age}</p>
                <p>Sex: {patient.sex}</p>
                <p>Added: {new Date(patient.createdat).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No patients found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'No patients match your search.' : 'Get started by adding your first patient.'}
          </p>
          {!searchTerm && (
            <Button onClick={onAddPatient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          )}
        </div>
      )}
    </div>
  );
};