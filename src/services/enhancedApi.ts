// ============================================================================
// ENHANCED API SERVICES WITH ROBUST ERROR HANDLING
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  Patient,
  Booking,
  EnhancedAllergyTest,
  TestSession,
  PatientFormData,
  BookingFormData,
  PatientSearchFilters,
  BookingSearchFilters,
  PaginatedResponse,
  ApiResponse
} from '@/types/medical';

// ============================================================================
// ENHANCED BASE API SERVICE
// ============================================================================

abstract class EnhancedBaseApiService {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    context: string,
    options: {
      showSuccessToast?: boolean;
      successMessage?: string;
      showErrorToast?: boolean;
      transformData?: (data: T) => T;
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      showSuccessToast = false,
      successMessage,
      showErrorToast = true,
      transformData
    } = options;

    try {
      const result = await apiClient.query(queryFn, context);

      if (result.error) {
        if (showErrorToast) {
          toast.error(`${context}: ${result.error.message}`);
        }
        return {
          success: false,
          error: {
            code: result.error.code || 'UNKNOWN_ERROR',
            message: result.error.message || 'An unknown error occurred'
          }
        };
      }

      let data = result.data;
      if (data && transformData) {
        data = transformData(data);
      }

      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (showErrorToast) {
        toast.error(`${context}: ${errorMessage}`);
      }

      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: errorMessage
        }
      };
    }
  }

  protected async executeQueryWithPagination<T>(
    queryBuilder: (limit: number, offset: number) => Promise<{ data: T[] | null; error: any; count?: number }>,
    page: number = 1,
    pageSize: number = 10,
    context: string
  ): Promise<PaginatedResponse<T>> {
    try {
      const offset = (page - 1) * pageSize;
      
      const result = await apiClient.query(
        () => queryBuilder(pageSize, offset),
        context
      );

      if (result.error) {
        return {
          data: [],
          pagination: {
            page,
            pageSize,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          },
          error: {
            code: result.error.code || 'UNKNOWN_ERROR',
            message: result.error.message || 'An unknown error occurred'
          }
        };
      }

      const totalItems = result.count || 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        data: result.data || [],
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        },
        error: null
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        data: [],
        pagination: {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        },
        error: {
          code: 'UNEXPECTED_ERROR',
          message: errorMessage
        }
      };
    }
  }
}

// ============================================================================
// ENHANCED PATIENT API SERVICE
// ============================================================================

export class EnhancedPatientApiService extends EnhancedBaseApiService {
  constructor() {
    super('patients');
  }

  async getAll(
    filters?: PatientSearchFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Patient>> {
    return this.executeQueryWithPagination(
      async (limit, offset) => {
        let query = supabase
          .from(this.tableName)
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .order('createdat', { ascending: false })
          .range(offset, offset + limit - 1);

        // Apply filters
        if (filters) {
          if (filters.name) {
            query = query.ilike('name', `%${filters.name}%`);
          }
          if (filters.sex && filters.sex !== 'all') {
            query = query.eq('sex', filters.sex);
          }
          if (filters.diagnosis) {
            query = query.ilike('provisionaldiagnosis', `%${filters.diagnosis}%`);
          }
          if (filters.physician) {
            query = query.ilike('referringphysician', `%${filters.physician}%`);
          }
          if (filters.ageRange) {
            query = query.gte('age', filters.ageRange[0]).lte('age', filters.ageRange[1]);
          }
          if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
            query = query.gte('dateoftesting', filters.dateRange[0]).lte('dateoftesting', filters.dateRange[1]);
          }
        }

        return query;
      },
      page,
      pageSize,
      'Fetch patients'
    );
  }

  async getById(id: string): Promise<ApiResponse<Patient>> {
    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single(),
      'Fetch patient details'
    );
  }

  async create(patientData: PatientFormData): Promise<ApiResponse<Patient>> {
    // Validate required fields
    if (!patientData.name?.trim()) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Patient name is required' }
      };
    }

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .insert([{
          name: patientData.name.trim(),
          age: patientData.age,
          sex: patientData.sex,
          labno: patientData.labno?.trim(),
          dateoftesting: patientData.dateoftesting,
          provisionaldiagnosis: patientData.provisionaldiagnosis?.trim(),
          referringphysician: patientData.referringphysician?.trim(),
          contactinfo: patientData.contactinfo || {},
          medical_history: patientData.medical_history?.trim(),
          allergies: patientData.allergies?.trim(),
          medications: patientData.medications?.trim(),
          is_active: true
        }])
        .select()
        .single(),
      'Create patient',
      {
        showSuccessToast: true,
        successMessage: 'Patient created successfully!'
      }
    );
  }

  async update(id: string, patientData: Partial<PatientFormData>): Promise<ApiResponse<Patient>> {
    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .update(patientData)
        .eq('id', id)
        .select()
        .single(),
      'Update patient',
      {
        showSuccessToast: true,
        successMessage: 'Patient updated successfully!'
      }
    );
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .update({ is_active: false })
        .eq('id', id),
      'Delete patient',
      {
        showSuccessToast: true,
        successMessage: 'Patient deleted successfully!'
      }
    );
  }

  async search(query: string): Promise<ApiResponse<Patient[]>> {
    if (!query.trim()) {
      return { success: true, data: [] };
    }

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,labno.ilike.%${query}%,provisionaldiagnosis.ilike.%${query}%`)
        .order('name')
        .limit(20),
      'Search patients'
    );
  }
}

// ============================================================================
// ENHANCED BOOKING API SERVICE
// ============================================================================

export class EnhancedBookingApiService extends EnhancedBaseApiService {
  constructor() {
    super('bookings');
  }

  async getAll(
    filters?: BookingSearchFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Booking>> {
    return this.executeQueryWithPagination(
      async (limit, offset) => {
        let query = supabase
          .from(this.tableName)
          .select(`
            *,
            patient:patient_id(name, labno),
            assigned_technician:assigned_technician(first_name, last_name),
            assigned_doctor:assigned_doctor(first_name, last_name)
          `, { count: 'exact' })
          .order('appointment_date', { ascending: true })
          .range(offset, offset + limit - 1);

        // Apply filters
        if (filters) {
          if (filters.status) {
            query = query.eq('status', filters.status);
          }
          if (filters.testType) {
            query = query.ilike('test_type', `%${filters.testType}%`);
          }
          if (filters.patientId) {
            query = query.eq('patient_id', filters.patientId);
          }
          if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
            query = query.gte('appointment_date', filters.dateRange[0]).lte('appointment_date', filters.dateRange[1]);
          }
        }

        return query;
      },
      page,
      pageSize,
      'Fetch bookings'
    );
  }

  async create(bookingData: BookingFormData): Promise<ApiResponse<Booking>> {
    // Validate required fields
    if (!bookingData.patientId) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Patient is required' }
      };
    }

    if (!bookingData.appointmentDate) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Appointment date is required' }
      };
    }

    // Check for conflicts
    const conflictCheck = await this.checkBookingConflict(
      bookingData.appointmentDate,
      bookingData.appointmentTime
    );

    if (!conflictCheck.success) {
      return conflictCheck as ApiResponse<Booking>;
    }

    if (conflictCheck.data && conflictCheck.data.length > 0) {
      return {
        success: false,
        error: { code: 'BOOKING_CONFLICT', message: 'This time slot is already booked' }
      };
    }

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .insert([{
          patient_id: bookingData.patientId,
          appointment_date: bookingData.appointmentDate,
          appointment_time: bookingData.appointmentTime,
          test_type: bookingData.testType,
          notes: bookingData.notes,
          duration_minutes: bookingData.durationMinutes || 60,
          status: 'scheduled'
        }])
        .select()
        .single(),
      'Create booking',
      {
        showSuccessToast: true,
        successMessage: 'Booking created successfully!'
      }
    );
  }

  private async checkBookingConflict(date: string, time: string): Promise<ApiResponse<Booking[]>> {
    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select('*')
        .eq('appointment_date', date)
        .eq('appointment_time', time)
        .neq('status', 'cancelled'),
      'Check booking conflicts',
      { showErrorToast: false }
    );
  }

  async updateStatus(id: string, status: string): Promise<ApiResponse<Booking>> {
    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .update({ status })
        .eq('id', id)
        .select()
        .single(),
      'Update booking status',
      {
        showSuccessToast: true,
        successMessage: `Booking ${status} successfully!`
      }
    );
  }
}

// Export enhanced API services
export const enhancedPatientApi = new EnhancedPatientApiService();
export const enhancedBookingApi = new EnhancedBookingApiService();