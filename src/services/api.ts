// ============================================================================
// COMPREHENSIVE API SERVICE LAYER
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { 
  Patient, 
  TestSession, 
  EnhancedAllergyTest, 
  Booking, 
  UserProfile, 
  Role,
  ActivityLog,
  Allergen,
  AllergenCategory,
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
  handleSupabaseError, 
  handleError, 
  validateRequired, 
  validateEmail, 
  validateAge, 
  validateLabNumber,
  ErrorCode,
  BusinessLogicError
} from '@/lib/errors';

// ============================================================================
// BASE API CLASS
// ============================================================================

class BaseApiService {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>,
    context: string
  ): Promise<ApiResponse<T>> {
    try {
      const result = await queryFn();
      
      if (result.error) {
        const error = handleSupabaseError(result.error, context);
        return { success: false, error: { code: error.code, message: error.message } };
      }

      return { success: true, data: result.data };
    } catch (error) {
      const appError = handleError(error, context);
      return { success: false, error: { code: appError.code, message: appError.message } };
    }
  }

  protected async executeQueryWithPagination<T>(
    queryFn: (from: number, to: number) => Promise<any>,
    page: number = 1,
    pageSize: number = 10,
    context: string
  ): Promise<PaginatedResponse<T>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const result = await queryFn(from, to);
      
      if (result.error) {
        const error = handleSupabaseError(result.error, context);
        return { 
          data: [], 
          pagination: { page, pageSize, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false },
          error: { code: error.code, message: error.message }
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
        }
      };
    } catch (error) {
      const appError = handleError(error, context);
      return { 
        data: [], 
        pagination: { page, pageSize, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false },
        error: { code: appError.code, message: appError.message }
      };
    }
  }
}

// ============================================================================
// PATIENT API SERVICE
// ============================================================================

export class PatientApiService extends BaseApiService {
  constructor() {
    super('patients');
  }

  async getAll(
    filters?: PatientSearchFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Patient>> {
    return this.executeQueryWithPagination(
      async (from, to) => {
        let query = supabase
          .from(this.tableName)
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .order('createdat', { ascending: false })
          .range(from, to);

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
      'PatientService.getAll'
    );
  }

  async getById(id: string): Promise<ApiResponse<Patient>> {
    validateRequired(id, 'Patient ID');

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single(),
      'PatientService.getById'
    );
  }

  async getByLabNumber(labNo: string): Promise<ApiResponse<Patient>> {
    validateRequired(labNo, 'Lab Number');
    validateLabNumber(labNo);

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select('*')
        .eq('labno', labNo)
        .eq('is_active', true)
        .single(),
      'PatientService.getByLabNumber'
    );
  }

  async create(patientData: PatientFormData, userId?: string): Promise<ApiResponse<Patient>> {
    // Validate required fields
    validateRequired(patientData.name, 'Name');
    validateRequired(patientData.age, 'Age');
    validateRequired(patientData.sex, 'Sex');
    validateRequired(patientData.labno, 'Lab Number');
    validateRequired(patientData.dateoftesting, 'Date of Testing');
    validateRequired(patientData.provisionaldiagnosis, 'Provisional Diagnosis');
    validateRequired(patientData.referringphysician, 'Referring Physician');

    // Validate data types and ranges
    validateAge(patientData.age);
    validateLabNumber(patientData.labno);

    // Check for duplicate lab number
    const existingPatient = await this.getByLabNumber(patientData.labno);
    if (existingPatient.success) {
      throw new BusinessLogicError(ErrorCode.DUPLICATE_RECORD, 'A patient with this lab number already exists');
    }

    const insertData = {
      ...patientData,
      contactinfo: patientData.contactinfo || {},
      medical_history: {},
      allergies: [],
      medications: [],
      created_by: userId,
      updated_by: userId
    };

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .insert([insertData])
        .select()
        .single(),
      'PatientService.create'
    );
  }

  async update(id: string, patientData: Partial<PatientFormData>, userId?: string): Promise<ApiResponse<Patient>> {
    validateRequired(id, 'Patient ID');

    // Validate fields if provided
    if (patientData.age !== undefined) validateAge(patientData.age);
    if (patientData.labno) validateLabNumber(patientData.labno);

    const updateData = {
      ...patientData,
      updated_by: userId,
      updatedat: new Date().toISOString()
    };

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .eq('is_active', true)
        .select()
        .single(),
      'PatientService.update'
    );
  }

  async delete(id: string, userId?: string): Promise<ApiResponse<void>> {
    validateRequired(id, 'Patient ID');

    // Soft delete
    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .update({ 
          is_active: false, 
          updated_by: userId,
          updatedat: new Date().toISOString()
        })
        .eq('id', id),
      'PatientService.delete'
    );
  }

  async search(query: string): Promise<ApiResponse<Patient[]>> {
    validateRequired(query, 'Search query');

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,labno.ilike.%${query}%,provisionaldiagnosis.ilike.%${query}%`)
        .order('createdat', { ascending: false })
        .limit(50),
      'PatientService.search'
    );
  }
}

// ============================================================================
// TEST SESSION API SERVICE
// ============================================================================

export class TestSessionApiService extends BaseApiService {
  constructor() {
    super('test_sessions');
  }

  async getByPatientId(
    patientId: string,
    filters?: TestSearchFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<TestSession>> {
    validateRequired(patientId, 'Patient ID');

    return this.executeQueryWithPagination(
      async (from, to) => {
        let query = supabase
          .from(this.tableName)
          .select(`
            *,
            technician:technician_id(first_name, last_name),
            doctor:doctor_id(first_name, last_name)
          `, { count: 'exact' })
          .eq('patient_id', patientId)
          .order('test_date', { ascending: false })
          .range(from, to);

        // Apply filters
        if (filters) {
          if (filters.testType) {
            query = query.eq('test_type', filters.testType);
          }
          if (filters.allergen) {
            query = query.ilike('allergen', `%${filters.allergen}%`);
          }
          if (filters.result) {
            query = query.eq('test_result', filters.result);
          }
          if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
            query = query.gte('test_date', filters.dateRange[0]).lte('test_date', filters.dateRange[1]);
          }
        }

        return query;
      },
      page,
      pageSize,
      'TestSessionService.getByPatientId'
    );
  }

  async create(testData: TestFormData, userId?: string): Promise<ApiResponse<TestSession>> {
    // Validate required fields
    validateRequired(testData.patientId, 'Patient ID');
    validateRequired(testData.testName, 'Test Name');
    validateRequired(testData.testType, 'Test Type');
    validateRequired(testData.allergen, 'Allergen');

    const insertData = {
      patient_id: testData.patientId,
      test_name: testData.testName,
      test_date: testData.testDate || new Date().toISOString().split('T')[0],
      test_type: testData.testType,
      allergen: testData.allergen,
      wheal_size_mm: testData.whealSizeMm,
      test_result: testData.testResult,
      notes: testData.notes,
      technician_id: userId
    };

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .insert([insertData])
        .select()
        .single(),
      'TestSessionService.create'
    );
  }

  async update(id: string, testData: Partial<TestFormData>, userId?: string): Promise<ApiResponse<TestSession>> {
    validateRequired(id, 'Test Session ID');

    const updateData = {
      ...testData,
      updated_at: new Date().toISOString()
    };

    if (testData.patientId) updateData.patient_id = testData.patientId;
    if (testData.testName) updateData.test_name = testData.testName;
    if (testData.testDate) updateData.test_date = testData.testDate;
    if (testData.testType) updateData.test_type = testData.testType;
    if (testData.whealSizeMm !== undefined) updateData.wheal_size_mm = testData.whealSizeMm;
    if (testData.testResult) updateData.test_result = testData.testResult;

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single(),
      'TestSessionService.update'
    );
  }
}

// ============================================================================
// ENHANCED ALLERGY TEST API SERVICE
// ============================================================================

export class EnhancedAllergyTestApiService extends BaseApiService {
  constructor() {
    super('enhanced_allergy_tests');
  }

  async getByPatientId(patientId: string): Promise<ApiResponse<EnhancedAllergyTest[]>> {
    validateRequired(patientId, 'Patient ID');

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select(`
          *,
          technician:technician_id(first_name, last_name),
          doctor:doctor_id(first_name, last_name),
          reviewer:reviewed_by(first_name, last_name)
        `)
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false }),
      'EnhancedAllergyTestService.getByPatientId'
    );
  }

  async create(testData: unknown, userId?: string): Promise<ApiResponse<EnhancedAllergyTest>> {
    validateRequired(testData.patientId, 'Patient ID');
    validateRequired(testData.patientInfo, 'Patient Info');
    validateRequired(testData.allergenResults, 'Allergen Results');
    validateRequired(testData.controls, 'Controls');

    const insertData = {
      patient_id: testData.patientId,
      test_date: testData.testDate || new Date().toISOString().split('T')[0],
      patient_info: testData.patientInfo,
      allergen_results: testData.allergenResults,
      controls: testData.controls,
      interpretation: testData.interpretation,
      recommendations: testData.recommendations,
      technician_id: userId
    };

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .insert([insertData])
        .select()
        .single(),
      'EnhancedAllergyTestService.create'
    );
  }

  async update(id: string, testData: unknown, userId?: string): Promise<ApiResponse<EnhancedAllergyTest>> {
    validateRequired(id, 'Enhanced Test ID');

    const updateData = {
      ...testData,
      updated_at: new Date().toISOString()
    };

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single(),
      'EnhancedAllergyTestService.update'
    );
  }

  async markAsReviewed(id: string, reviewerId: string, interpretation?: string, recommendations?: string): Promise<ApiResponse<EnhancedAllergyTest>> {
    validateRequired(id, 'Enhanced Test ID');
    validateRequired(reviewerId, 'Reviewer ID');

    const updateData = {
      is_reviewed: true,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      interpretation,
      recommendations,
      updated_at: new Date().toISOString()
    };

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single(),
      'EnhancedAllergyTestService.markAsReviewed'
    );
  }
}

// ============================================================================
// BOOKING API SERVICE
// ============================================================================

export class BookingApiService extends BaseApiService {
  constructor() {
    super('bookings');
  }

  async getAll(
    filters?: BookingSearchFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Booking>> {
    return this.executeQuery(
      async () => {
        let query = supabase
          .from(this.tableName)
          .select(`
            *,
            patient:patient_id(name, labno)
          `)
          .order('appointment_date', { ascending: true });

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

        // Use simple limit instead of range to avoid parsing issues
        query = query.limit(100);

        return query;
      },
      'BookingService.getAll'
    ).then(result => {
      if (!result.success) {
        return {
          data: [],
          pagination: { page, pageSize, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false },
          error: result.error
        };
      }

      const totalItems = result.data?.length || 0;
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
    });
  }

  async create(bookingData: BookingFormData, userId?: string): Promise<ApiResponse<Booking>> {
    // Check authentication first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: 'Authentication required. Please sign in to create bookings.',
          context: 'BookingApiService.create'
        }
      };
    }

    // Validate required fields
    validateRequired(bookingData.patientId, 'Patient ID');
    validateRequired(bookingData.appointmentDate, 'Appointment Date');
    validateRequired(bookingData.appointmentTime, 'Appointment Time');
    validateRequired(bookingData.testType, 'Test Type');

    // Check for booking conflicts (disabled temporarily to avoid issues)
    // const conflictCheck = await this.checkBookingConflict(
    //   bookingData.appointmentDate,
    //   bookingData.appointmentTime
    // );

    // if (conflictCheck.success && conflictCheck.data && conflictCheck.data.length > 0) {
    //   throw new BusinessLogicError(ErrorCode.BOOKING_CONFLICT, 'This time slot is already booked');
    // }

    const insertData = {
      patient_id: bookingData.patientId,
      appointment_date: bookingData.appointmentDate,
      appointment_time: bookingData.appointmentTime,
      test_type: bookingData.testType,
      notes: bookingData.notes || '',
      duration_minutes: bookingData.durationMinutes || 60,
      status: 'scheduled',
      created_by: userId || session.user.id
    };

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .insert([insertData])
        .select()
        .single(),
      'BookingService.create'
    );
  }

  async update(id: string, bookingData: Partial<BookingFormData>, userId?: string): Promise<ApiResponse<Booking>> {
    validateRequired(id, 'Booking ID');

    const updateData = {
      ...bookingData,
      updated_at: new Date().toISOString()
    };

    if (bookingData.patientId) updateData.patient_id = bookingData.patientId;
    if (bookingData.appointmentDate) updateData.appointment_date = bookingData.appointmentDate;
    if (bookingData.appointmentTime) updateData.appointment_time = bookingData.appointmentTime;
    if (bookingData.testType) updateData.test_type = bookingData.testType;
    if (bookingData.durationMinutes) updateData.duration_minutes = bookingData.durationMinutes;

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single(),
      'BookingService.update'
    );
  }

  async updateStatus(id: string, status: string, userId?: string): Promise<ApiResponse<Booking>> {
    validateRequired(id, 'Booking ID');
    validateRequired(status, 'Status');

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single(),
      'BookingService.updateStatus'
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
      'BookingService.checkBookingConflict'
    );
  }
}

// ============================================================================
// ALLERGEN API SERVICE
// ============================================================================

export class AllergenApiService extends BaseApiService {
  constructor() {
    super('allergens');
  }

  async getAll(): Promise<ApiResponse<Allergen[]>> {
    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select(`
          *,
          category:category_id(name, description)
        `)
        .eq('is_active', true)
        .order('sno', { ascending: true }),
      'AllergenService.getAll'
    );
  }

  async getByCategory(categoryId: string): Promise<ApiResponse<Allergen[]>> {
    validateRequired(categoryId, 'Category ID');

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select(`
          *,
          category:category_id(name, description)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sno', { ascending: true }),
      'AllergenService.getByCategory'
    );
  }
}

export class AllergenCategoryApiService extends BaseApiService {
  constructor() {
    super('allergen_categories');
  }

  async getAll(): Promise<ApiResponse<AllergenCategory[]>> {
    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      'AllergenCategoryService.getAll'
    );
  }
}

// ============================================================================
// ACTIVITY LOG API SERVICE
// ============================================================================

export class ActivityLogApiService extends BaseApiService {
  constructor() {
    super('activity_logs');
  }

  async log(
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    userId?: string
  ): Promise<ApiResponse<ActivityLog>> {
    validateRequired(action, 'Action');
    validateRequired(resourceType, 'Resource Type');

    const logData = {
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details || {},
      ip_address: null, // Will be populated by database trigger if needed
      user_agent: navigator?.userAgent,
      session_id: null // Will be populated by authentication system
    };

    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .insert([logData])
        .select()
        .single(),
      'ActivityLogService.log'
    );
  }

  async getByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<ActivityLog>> {
    validateRequired(userId, 'User ID');

    return this.executeQueryWithPagination(
      async (from, to) => supabase
        .from(this.tableName)
        .select(`
          *,
          user:user_id(first_name, last_name, email)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to),
      page,
      pageSize,
      'ActivityLogService.getByUser'
    );
  }

  async getRecent(limit: number = 50): Promise<ApiResponse<ActivityLog[]>> {
    return this.executeQuery(
      () => supabase
        .from(this.tableName)
        .select(`
          *,
          user:user_id(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit),
      'ActivityLogService.getRecent'
    );
  }
}

// ============================================================================
// EXPORT API SERVICES
// ============================================================================

export const patientApi = new PatientApiService();
export const testSessionApi = new TestSessionApiService();
export const enhancedAllergyTestApi = new EnhancedAllergyTestApiService();
export const bookingApi = new BookingApiService();
export const allergenApi = new AllergenApiService();
export const allergenCategoryApi = new AllergenCategoryApiService();
export const activityLogApi = new ActivityLogApiService();

// Export all services as default
export default {
  patients: patientApi,
  testSessions: testSessionApi,
  enhancedAllergyTests: enhancedAllergyTestApi,
  bookings: bookingApi,
  allergens: allergenApi,
  allergenCategories: allergenCategoryApi,
  activityLogs: activityLogApi
};