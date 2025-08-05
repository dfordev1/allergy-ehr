import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Plus, 
  User, 
  Calendar, 
  TestTube,
  ChevronRight,
  Filter,
  SortAsc
} from 'lucide-react';
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
  createdat: string;
}

interface OptimizedPatientListProps {
  onAddPatient: () => void;
}

// Custom hook for patient data with React Query
const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('createdat', { ascending: false });

      if (error) {
        throw new Error('Failed to fetch patients');
      }
      return data as Patient[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const OptimizedPatientList: React.FC<OptimizedPatientListProps> = ({ onAddPatient }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'age'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'male' | 'female'>('all');

  const { data: patients = [], isLoading, error } = usePatients();

  // Memoized filtered and sorted patients
  const filteredPatients = useMemo(() => {
    let filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.labno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.provisionaldiagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply filters
    if (filterBy === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(patient => 
        new Date(patient.createdat) > oneWeekAgo
      );
    } else if (filterBy === 'male' || filterBy === 'female') {
      filtered = filtered.filter(patient => 
        patient.sex.toLowerCase() === filterBy
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'age':
          return b.age - a.age;
        case 'date':
        default:
          return new Date(b.createdat).getTime() - new Date(a.createdat).getTime();
      }
    });
  }, [patients, searchTerm, sortBy, filterBy]);

  // Optimized navigation with prefetching
  const handlePatientClick = useCallback((patientId: string) => {
    // Prefetch patient details
    queryClient.prefetchQuery({
      queryKey: ['patient', patientId],
      queryFn: async () => {
        const { data } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
        return data;
      },
    });
    
    navigate(`/patient/${patientId}`);
  }, [navigate, queryClient]);

  // Optimized add patient success handler
  const handleAddSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['patients'] });
    toast.success('Patient added successfully!');
  }, [queryClient]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Error loading patients. Please try again.</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['patients'] })}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Filter Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Patient Records</span>
              <Badge variant="outline">{filteredPatients.length} patients</Badge>
            </CardTitle>
            <Button onClick={onAddPatient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search patients by name, lab number, or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="age">Sort by Age</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Patients</option>
              <option value="recent">Recent (7 days)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Optimized Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : filteredPatients.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No patients found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first patient'}
              </p>
              <Button onClick={onAddPatient}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Patient
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card 
              key={patient.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
              onClick={() => handlePatientClick(patient.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg truncate">{patient.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <span>{patient.age} years</span>
                      <span>{patient.sex}</span>
                      <Badge variant="outline" className="text-xs">
                        {patient.labno}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {new Date(patient.dateoftesting).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Diagnosis:</span>
                    <p className="text-muted-foreground truncate mt-1">
                      {patient.provisionaldiagnosis}
                    </p>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Physician:</span>
                    <p className="text-muted-foreground truncate">
                      {patient.referringphysician}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Added {new Date(patient.createdat).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-1">
                    <TestTube className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">View Tests</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {!isLoading && filteredPatients.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{filteredPatients.length}</div>
                <div className="text-sm text-muted-foreground">Total Patients</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredPatients.filter(p => p.sex === 'Female').length}
                </div>
                <div className="text-sm text-muted-foreground">Female</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredPatients.filter(p => p.sex === 'Male').length}
                </div>
                <div className="text-sm text-muted-foreground">Male</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(filteredPatients.reduce((sum, p) => sum + p.age, 0) / filteredPatients.length) || 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg Age</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};