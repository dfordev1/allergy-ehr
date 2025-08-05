import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Download, 
  Mail, 
  Phone,
  Calendar,
  User,
  TestTube,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  age: number;
  sex: string;
  labno: string;
  dateoftesting: string;
  provisionaldiagnosis: string;
  referringphysician: string;
  contactinfo: any;
  createdat: string;
}

interface SearchFilters {
  name: string;
  ageRange: [number, number];
  sex: string;
  diagnosis: string;
  physician: string;
  hasTests: string;
  hasPositiveResults: string;
  dateRange: [string, string];
}

interface AdvancedPatientSearchProps {
  onPatientSelect: (patient: Patient) => void;
  onBulkAction: (action: string, patientIds: string[]) => void;
}

export const AdvancedPatientSearch = ({ onPatientSelect, onBulkAction }: AdvancedPatientSearchProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [filters, setFilters] = useState<SearchFilters>({
    name: '',
    ageRange: [0, 100],
    sex: '',
    diagnosis: '',
    physician: '',
    hasTests: '',
    hasPositiveResults: '',
    dateRange: ['', '']
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [patients, filters, sortBy, sortOrder]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('createdat', { ascending: false });

      if (error) {
        toast.error('Error fetching patients');
        return;
      }

      setPatients(data || []);
    } catch (error) {
      toast.error('Error fetching patients');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...patients];

    // Apply text filters
    if (filters.name) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.diagnosis) {
      filtered = filtered.filter(patient =>
        patient.provisionaldiagnosis.toLowerCase().includes(filters.diagnosis.toLowerCase())
      );
    }

    if (filters.physician) {
      filtered = filtered.filter(patient =>
        patient.referringphysician.toLowerCase().includes(filters.physician.toLowerCase())
      );
    }

    // Apply age filter
    filtered = filtered.filter(patient =>
      patient.age >= filters.ageRange[0] && patient.age <= filters.ageRange[1]
    );

         // Apply sex filter
     if (filters.sex && filters.sex !== 'all') {
       filtered = filtered.filter(patient => patient.sex === filters.sex);
     }

    // Apply date range filter
    if (filters.dateRange[0] && filters.dateRange[1]) {
      filtered = filtered.filter(patient => {
        const testDate = new Date(patient.dateoftesting);
        const startDate = new Date(filters.dateRange[0]);
        const endDate = new Date(filters.dateRange[1]);
        return testDate >= startDate && testDate <= endDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Patient];
      let bValue: any = b[sortBy as keyof Patient];

      if (sortBy === 'name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredPatients(filtered);
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatients(prev =>
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map(p => p.id));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedPatients.length === 0) {
      toast.error('Please select patients first');
      return;
    }
    onBulkAction(action, selectedPatients);
  };

  const exportPatients = () => {
    if (filteredPatients.length === 0) {
      toast.error('No patients to export');
      return;
    }

    const dataToExport = filteredPatients.map(patient => ({
      Name: patient.name,
      Age: patient.age,
      Sex: patient.sex,
      'Lab Number': patient.labno,
      'Test Date': patient.dateoftesting,
      Diagnosis: patient.provisionaldiagnosis,
      Physician: patient.referringphysician,
      'Contact Info': patient.contactinfo ? JSON.stringify(patient.contactinfo) : ''
    }));

    const csv = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).map(value => `"${value || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Patients exported successfully!');
  };

  const getPatientStats = (patient: Patient) => {
    // This would be enhanced with actual test data
    return {
      testCount: 0,
      positiveResults: 0,
      lastTestDate: patient.dateoftesting
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading patients...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Advanced Patient Search</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={exportPatients}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients by name, diagnosis, or physician..."
              value={filters.name}
              onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
              className="pl-10"
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Age Range</label>
                <Slider
                  value={filters.ageRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value as [number, number] }))}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {filters.ageRange[0]} - {filters.ageRange[1]} years
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sex</label>
                <Select value={filters.sex} onValueChange={(value) => setFilters(prev => ({ ...prev, sex: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                                     <SelectContent>
                     <SelectItem value="all">All</SelectItem>
                     <SelectItem value="Male">Male</SelectItem>
                     <SelectItem value="Female">Female</SelectItem>
                   </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Diagnosis</label>
                <Input
                  placeholder="Filter by diagnosis"
                  value={filters.diagnosis}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnosis: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Physician</label>
                <Input
                  placeholder="Filter by physician"
                  value={filters.physician}
                  onChange={(e) => setFilters(prev => ({ ...prev, physician: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="age">Age</SelectItem>
                  <SelectItem value="dateoftesting">Test Date</SelectItem>
                  <SelectItem value="createdat">Created</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredPatients.length} of {patients.length} patients
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPatients.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedPatients.length} patient(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={() => handleBulkAction('export')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedPatients([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient List */}
      <div className="space-y-4">
        {filteredPatients.map((patient) => {
          const stats = getPatientStats(patient);
          const isSelected = selectedPatients.includes(patient.id);
          
          return (
            <Card key={patient.id} className={`cursor-pointer transition-colors ${
              isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectPatient(patient.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{patient.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{patient.age} years old</span>
                          <span>{patient.sex}</span>
                          <span>Lab: {patient.labno}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{patient.provisionaldiagnosis}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPatientSelect(patient);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <TestTube className="h-3 w-3" />
                        <span>{stats.testCount} tests</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{stats.positiveResults} positive</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Last: {new Date(stats.lastTestDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{patient.referringphysician}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPatients.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No patients found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 