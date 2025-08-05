// ============================================================================
// MODERN PATIENT LIST COMPONENT WITH COMPREHENSIVE ERROR HANDLING
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  User, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatients, usePrefetchPatient } from '@/hooks/useApi';
import { ComponentErrorBoundary } from '@/components/errors/ErrorBoundary';
import { PatientSearchFilters, Patient } from '@/types/medical';
import { handleError } from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

interface PatientListProps {
  onAddPatient: () => void;
}

interface PatientCardProps {
  patient: Patient;
  onPatientClick: (patientId: string) => void;
  onPatientHover: (patientId: string) => void;
}

// ============================================================================
// PATIENT CARD COMPONENT
// ============================================================================

const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  onPatientClick, 
  onPatientHover 
}) => {
  const getAgeColor = (age: number) => {
    if (age < 18) return 'bg-blue-100 text-blue-800';
    if (age < 65) return 'bg-green-100 text-green-800';
    return 'bg-orange-100 text-orange-800';
  };

  const getSexIcon = (sex: string) => {
    switch (sex.toLowerCase()) {
      case 'male':
      case 'm':
        return '♂';
      case 'female':
      case 'f':
        return '♀';
      default:
        return '○';
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
      onClick={() => onPatientClick(patient.id)}
      onMouseEnter={() => onPatientHover(patient.id)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="truncate">{patient.name}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {patient.labno}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={getAgeColor(patient.age)}>
              {patient.age}y
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getSexIcon(patient.sex)} {patient.sex}
            </Badge>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="truncate">
            <span className="font-medium">Diagnosis:</span> {patient.provisionaldiagnosis}
          </p>
          <p className="truncate">
            <span className="font-medium">Physician:</span> {patient.referringphysician}
          </p>
          <p className="text-xs">
            <span className="font-medium">Added:</span> {new Date(patient.createdat).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

const PatientCardSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 bg-muted rounded animate-pulse" />
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-5 w-16 bg-muted rounded animate-pulse" />
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="h-5 w-12 bg-muted rounded animate-pulse" />
        <div className="h-5 w-12 bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-1">
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState: React.FC<{ 
  hasSearch: boolean; 
  onAddPatient: () => void; 
  onClearSearch: () => void;
}> = ({ hasSearch, onAddPatient, onClearSearch }) => (
  <Card>
    <CardContent className="p-8 text-center">
      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">
        {hasSearch ? 'No patients match your search' : 'No patients yet'}
      </h3>
      <p className="text-muted-foreground mb-4">
        {hasSearch 
          ? 'Try adjusting your search terms or clear the search to see all patients' 
          : 'Start by adding your first patient to the system'
        }
      </p>
      <div className="flex gap-2 justify-center">
        {hasSearch ? (
          <Button onClick={onClearSearch} variant="outline">
            Clear Search
          </Button>
        ) : (
          <Button onClick={onAddPatient}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Patient
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// ERROR STATE
// ============================================================================

const ErrorState: React.FC<{ 
  error: any; 
  onRetry: () => void; 
}> = ({ error, onRetry }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>Failed to load patients: {error?.message || 'Unknown error'}</span>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </AlertDescription>
  </Alert>
);

// ============================================================================
// PAGINATION CONTROLS
// ============================================================================

const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}> = ({ 
  currentPage, 
  totalPages, 
  hasNext, 
  hasPrevious, 
  onPageChange, 
  totalItems, 
  pageSize 
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems} patients
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            );
          })}
          {totalPages > 5 && (
            <>
              <span className="text-muted-foreground">...</span>
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PATIENT LIST COMPONENT
// ============================================================================

export const PatientListV2: React.FC<PatientListProps> = ({ onAddPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const navigate = useNavigate();
  const prefetchPatient = usePrefetchPatient();

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Create filters based on search term
  const filters: PatientSearchFilters = useMemo(() => {
    return debouncedSearchTerm ? { name: debouncedSearchTerm } : {};
  }, [debouncedSearchTerm]);

  // Use the new API hook
  const { 
    data: patientsResponse, 
    isLoading, 
    error, 
    isError,
    refetch 
  } = usePatients(filters, page, 10);

  // Handle patient navigation
  const handlePatientClick = (patientId: string) => {
    navigate(`/patient/${patientId}`);
  };

  // Handle patient hover for prefetching
  const handlePatientHover = (patientId: string) => {
    prefetchPatient(patientId);
  };

  // Handle search clear
  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setPage(1);
  };

  // Handle retry
  const handleRetry = () => {
    refetch().catch((error) => {
      handleError(error, 'PatientList.retry');
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Extract data from response
  const patients = patientsResponse?.data || [];
  const pagination = patientsResponse?.pagination;

  return (
    <ComponentErrorBoundary componentName="PatientList">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Patients</h2>
            {pagination && (
              <p className="text-sm text-muted-foreground">
                {pagination.totalItems} total patients
              </p>
            )}
          </div>
          <Button onClick={onAddPatient}>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <PatientCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <ErrorState error={error} onRetry={handleRetry} />
        )}

        {/* Empty State */}
        {!isLoading && !isError && patients.length === 0 && (
          <EmptyState 
            hasSearch={!!debouncedSearchTerm} 
            onAddPatient={onAddPatient}
            onClearSearch={handleClearSearch}
          />
        )}

        {/* Patient Grid */}
        {!isLoading && !isError && patients.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onPatientClick={handlePatientClick}
                  onPatientHover={handlePatientHover}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                hasNext={pagination.hasNext}
                hasPrevious={pagination.hasPrevious}
                onPageChange={handlePageChange}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
              />
            )}
          </>
        )}
      </div>
    </ComponentErrorBoundary>
  );
};

export default PatientListV2;