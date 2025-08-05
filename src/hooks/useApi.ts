// ============================================================================
// REACT QUERY HOOKS FOR API INTEGRATION
// ============================================================================

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { 
  Patient, 
  TestSession, 
  EnhancedAllergyTest, 
  Booking, 
  Allergen,
  AllergenCategory,
  ActivityLog,
  PatientFormData,
  TestFormData,
  BookingFormData,
  PatientSearchFilters,
  TestSearchFilters,
  BookingSearchFilters,
  PaginatedResponse,
  ApiResponse
} from '@/types/medical';
import {
  patientApi,
  testSessionApi,
  enhancedAllergyTestApi,
  bookingApi,
  allergenApi,
  allergenCategoryApi,
  activityLogApi
} from '@/services/api';
import { handleError } from '@/lib/errors';
import { toast } from 'sonner';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const queryKeys = {
  // Patient keys
  patients: ['patients'] as const,
  patientsList: (filters?: PatientSearchFilters, page?: number) => 
    [...queryKeys.patients, 'list', { filters, page }] as const,
  patientsDetail: (id: string) => [...queryKeys.patients, 'detail', id] as const,
  patientsSearch: (query: string) => [...queryKeys.patients, 'search', query] as const,

  // Test session keys
  testSessions: ['testSessions'] as const,
  testSessionsByPatient: (patientId: string, filters?: TestSearchFilters, page?: number) => 
    [...queryKeys.testSessions, 'byPatient', patientId, { filters, page }] as const,

  // Enhanced allergy test keys
  enhancedTests: ['enhancedTests'] as const,
  enhancedTestsByPatient: (patientId: string) => 
    [...queryKeys.enhancedTests, 'byPatient', patientId] as const,

  // Booking keys
  bookings: ['bookings'] as const,
  bookingsList: (filters?: BookingSearchFilters, page?: number) => 
    [...queryKeys.bookings, 'list', { filters, page }] as const,

  // Allergen keys
  allergens: ['allergens'] as const,
  allergensList: () => [...queryKeys.allergens, 'list'] as const,
  allergensByCategory: (categoryId: string) => 
    [...queryKeys.allergens, 'byCategory', categoryId] as const,

  // Allergen category keys
  allergenCategories: ['allergenCategories'] as const,
  allergenCategoriesList: () => [...queryKeys.allergenCategories, 'list'] as const,

  // Activity log keys
  activityLogs: ['activityLogs'] as const,
  activityLogsByUser: (userId: string, page?: number) => 
    [...queryKeys.activityLogs, 'byUser', userId, { page }] as const,
  activityLogsRecent: (limit?: number) => 
    [...queryKeys.activityLogs, 'recent', { limit }] as const,
} as const;

// ============================================================================
// PATIENT HOOKS
// ============================================================================

export const usePatients = (
  filters?: PatientSearchFilters,
  page: number = 1,
  pageSize: number = 10,
  options?: UseQueryOptions<PaginatedResponse<Patient>>
) => {
  return useQuery({
    queryKey: queryKeys.patientsList(filters, page),
    queryFn: () => patientApi.getAll(filters, page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const usePatient = (
  id: string,
  options?: UseQueryOptions<ApiResponse<Patient>>
) => {
  return useQuery({
    queryKey: queryKeys.patientsDetail(id),
    queryFn: () => patientApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
};

export const usePatientSearch = (
  query: string,
  options?: UseQueryOptions<ApiResponse<Patient[]>>
) => {
  return useQuery({
    queryKey: queryKeys.patientsSearch(query),
    queryFn: () => patientApi.search(query),
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCreatePatient = (
  options?: UseMutationOptions<ApiResponse<Patient>, Error, { data: PatientFormData; userId?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, userId }) => patientApi.create(data, userId),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate patients list
        queryClient.invalidateQueries({ queryKey: queryKeys.patients });
        toast.success('Patient created successfully');
        
        // Log activity
        if (result.data) {
          activityLogApi.log('CREATE', 'PATIENT', result.data.id, { patientName: result.data.name });
        }
      } else {
        toast.error(result.error?.message || 'Failed to create patient');
      }
    },
    onError: (error) => {
      handleError(error, 'CreatePatient');
    },
    ...options,
  });
};

export const useUpdatePatient = (
  options?: UseMutationOptions<ApiResponse<Patient>, Error, { id: string; data: Partial<PatientFormData>; userId?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, userId }) => patientApi.update(id, data, userId),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate specific patient and patients list
        queryClient.invalidateQueries({ queryKey: queryKeys.patientsDetail(variables.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.patients });
        toast.success('Patient updated successfully');
        
        // Log activity
        if (result.data) {
          activityLogApi.log('UPDATE', 'PATIENT', result.data.id, { patientName: result.data.name });
        }
      } else {
        toast.error(result.error?.message || 'Failed to update patient');
      }
    },
    onError: (error) => {
      handleError(error, 'UpdatePatient');
    },
    ...options,
  });
};

export const useDeletePatient = (
  options?: UseMutationOptions<ApiResponse<void>, Error, { id: string; userId?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }) => patientApi.delete(id, userId),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Remove from cache and invalidate list
        queryClient.removeQueries({ queryKey: queryKeys.patientsDetail(variables.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.patients });
        toast.success('Patient deleted successfully');
        
        // Log activity
        activityLogApi.log('DELETE', 'PATIENT', variables.id);
      } else {
        toast.error(result.error?.message || 'Failed to delete patient');
      }
    },
    onError: (error) => {
      handleError(error, 'DeletePatient');
    },
    ...options,
  });
};

// ============================================================================
// TEST SESSION HOOKS
// ============================================================================

export const useTestSessionsByPatient = (
  patientId: string,
  filters?: TestSearchFilters,
  page: number = 1,
  pageSize: number = 10,
  options?: UseQueryOptions<PaginatedResponse<TestSession>>
) => {
  return useQuery({
    queryKey: queryKeys.testSessionsByPatient(patientId, filters, page),
    queryFn: () => testSessionApi.getByPatientId(patientId, filters, page, pageSize),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useCreateTestSession = (
  options?: UseMutationOptions<ApiResponse<TestSession>, Error, { data: TestFormData; userId?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, userId }) => testSessionApi.create(data, userId),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate test sessions for the patient
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.testSessionsByPatient(variables.data.patientId) 
        });
        toast.success('Test session created successfully');
        
        // Log activity
        if (result.data) {
          activityLogApi.log('CREATE', 'TEST_SESSION', result.data.id, { 
            testName: result.data.testName,
            patientId: result.data.patientId 
          });
        }
      } else {
        toast.error(result.error?.message || 'Failed to create test session');
      }
    },
    onError: (error) => {
      handleError(error, 'CreateTestSession');
    },
    ...options,
  });
};

export const useUpdateTestSession = (
  options?: UseMutationOptions<ApiResponse<TestSession>, Error, { id: string; data: Partial<TestFormData>; userId?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, userId }) => testSessionApi.update(id, data, userId),
    onSuccess: (result, variables) => {
      if (result.success && result.data) {
        // Invalidate test sessions for the patient
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.testSessionsByPatient(result.data.patientId) 
        });
        toast.success('Test session updated successfully');
        
        // Log activity
        activityLogApi.log('UPDATE', 'TEST_SESSION', variables.id, { 
          testName: result.data.testName 
        });
      } else {
        toast.error(result.error?.message || 'Failed to update test session');
      }
    },
    onError: (error) => {
      handleError(error, 'UpdateTestSession');
    },
    ...options,
  });
};

// ============================================================================
// ENHANCED ALLERGY TEST HOOKS
// ============================================================================

export const useEnhancedTestsByPatient = (
  patientId: string,
  options?: UseQueryOptions<ApiResponse<EnhancedAllergyTest[]>>
) => {
  return useQuery({
    queryKey: queryKeys.enhancedTestsByPatient(patientId),
    queryFn: () => enhancedAllergyTestApi.getByPatientId(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useCreateEnhancedTest = (
  options?: UseMutationOptions<ApiResponse<EnhancedAllergyTest>, Error, { data: any; userId?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, userId }) => enhancedAllergyTestApi.create(data, userId),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate enhanced tests for the patient
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.enhancedTestsByPatient(variables.data.patientId) 
        });
        toast.success('Enhanced allergy test created successfully');
        
        // Log activity
        if (result.data) {
          activityLogApi.log('CREATE', 'ENHANCED_TEST', result.data.id, { 
            patientId: result.data.patientId 
          });
        }
      } else {
        toast.error(result.error?.message || 'Failed to create enhanced test');
      }
    },
    onError: (error) => {
      handleError(error, 'CreateEnhancedTest');
    },
    ...options,
  });
};

export const useReviewEnhancedTest = (
  options?: UseMutationOptions<ApiResponse<EnhancedAllergyTest>, Error, { 
    id: string; 
    reviewerId: string; 
    interpretation?: string; 
    recommendations?: string 
  }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reviewerId, interpretation, recommendations }) => 
      enhancedAllergyTestApi.markAsReviewed(id, reviewerId, interpretation, recommendations),
    onSuccess: (result, variables) => {
      if (result.success && result.data) {
        // Invalidate enhanced tests for the patient
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.enhancedTestsByPatient(result.data.patientId) 
        });
        toast.success('Test reviewed successfully');
        
        // Log activity
        activityLogApi.log('REVIEW', 'ENHANCED_TEST', variables.id);
      } else {
        toast.error(result.error?.message || 'Failed to review test');
      }
    },
    onError: (error) => {
      handleError(error, 'ReviewEnhancedTest');
    },
    ...options,
  });
};

// ============================================================================
// BOOKING HOOKS
// ============================================================================

export const useBookings = (
  filters?: BookingSearchFilters,
  page: number = 1,
  pageSize: number = 10,
  options?: UseQueryOptions<PaginatedResponse<Booking>>
) => {
  return useQuery({
    queryKey: queryKeys.bookingsList(filters, page),
    queryFn: () => bookingApi.getAll(filters, page, pageSize),
    staleTime: 2 * 60 * 1000, // 2 minutes for bookings
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCreateBooking = (
  options?: UseMutationOptions<ApiResponse<Booking>, Error, { data: BookingFormData; userId?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, userId }) => bookingApi.create(data, userId),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate bookings list
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
        toast.success('Booking created successfully');
        
        // Log activity
        if (result.data) {
          activityLogApi.log('CREATE', 'BOOKING', result.data.id, { 
            patientId: result.data.patientId,
            appointmentDate: result.data.appointmentDate 
          });
        }
      } else {
        toast.error(result.error?.message || 'Failed to create booking');
      }
    },
    onError: (error) => {
      handleError(error, 'CreateBooking');
    },
    ...options,
  });
};

export const useUpdateBookingStatus = (
  options?: UseMutationOptions<ApiResponse<Booking>, Error, { id: string; status: string; userId?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, userId }) => bookingApi.updateStatus(id, status, userId),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate bookings list
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
        toast.success('Booking status updated successfully');
        
        // Log activity
        activityLogApi.log('UPDATE_STATUS', 'BOOKING', variables.id, { 
          newStatus: variables.status 
        });
      } else {
        toast.error(result.error?.message || 'Failed to update booking status');
      }
    },
    onError: (error) => {
      handleError(error, 'UpdateBookingStatus');
    },
    ...options,
  });
};

// ============================================================================
// ALLERGEN HOOKS
// ============================================================================

export const useAllergens = (
  options?: UseQueryOptions<ApiResponse<Allergen[]>>
) => {
  return useQuery({
    queryKey: queryKeys.allergensList(),
    queryFn: () => allergenApi.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes - allergens don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

export const useAllergensByCategory = (
  categoryId: string,
  options?: UseQueryOptions<ApiResponse<Allergen[]>>
) => {
  return useQuery({
    queryKey: queryKeys.allergensByCategory(categoryId),
    queryFn: () => allergenApi.getByCategory(categoryId),
    enabled: !!categoryId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    ...options,
  });
};

export const useAllergenCategories = (
  options?: UseQueryOptions<ApiResponse<AllergenCategory[]>>
) => {
  return useQuery({
    queryKey: queryKeys.allergenCategoriesList(),
    queryFn: () => allergenCategoryApi.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

// ============================================================================
// ACTIVITY LOG HOOKS
// ============================================================================

export const useActivityLogsByUser = (
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  options?: UseQueryOptions<PaginatedResponse<ActivityLog>>
) => {
  return useQuery({
    queryKey: queryKeys.activityLogsByUser(userId, page),
    queryFn: () => activityLogApi.getByUser(userId, page, pageSize),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useRecentActivityLogs = (
  limit: number = 50,
  options?: UseQueryOptions<ApiResponse<ActivityLog[]>>
) => {
  return useQuery({
    queryKey: queryKeys.activityLogsRecent(limit),
    queryFn: () => activityLogApi.getRecent(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidatePatients: () => queryClient.invalidateQueries({ queryKey: queryKeys.patients }),
    invalidateTestSessions: (patientId?: string) => {
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.testSessionsByPatient(patientId) });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.testSessions });
      }
    },
    invalidateEnhancedTests: (patientId?: string) => {
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.enhancedTestsByPatient(patientId) });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.enhancedTests });
      }
    },
    invalidateBookings: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
};

export const usePrefetchPatient = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.patientsDetail(id),
      queryFn: () => patientApi.getById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// ============================================================================
// OPTIMISTIC UPDATES HELPERS
// ============================================================================

export const useOptimisticPatientUpdate = () => {
  const queryClient = useQueryClient();

  return {
    updatePatientOptimistically: (id: string, updates: Partial<Patient>) => {
      queryClient.setQueryData(
        queryKeys.patientsDetail(id),
        (old: ApiResponse<Patient> | undefined) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: { ...old.data, ...updates }
          };
        }
      );
    },
    rollbackPatientUpdate: (id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientsDetail(id) });
    }
  };
};