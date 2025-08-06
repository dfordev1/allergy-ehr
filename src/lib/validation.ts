// ============================================================================
// COMPREHENSIVE DATA VALIDATION
// ============================================================================

import { z } from 'zod';

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const labNumberRegex = /^[A-Z0-9]{3,20}$/i;

// ============================================================================
// PATIENT VALIDATION
// ============================================================================

export const patientValidationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-\.]+$/, 'Name can only contain letters, spaces, hyphens, and periods'),
  
  age: z
    .number()
    .min(0, 'Age must be 0 or greater')
    .max(150, 'Age must be less than 150'),
  
  sex: z
    .enum(['Male', 'Female', 'Other'], {
      errorMap: () => ({ message: 'Please select a valid gender' })
    }),
  
  labno: z
    .string()
    .min(3, 'Lab number must be at least 3 characters')
    .max(20, 'Lab number must be less than 20 characters')
    .regex(labNumberRegex, 'Lab number must contain only letters and numbers'),
  
  dateoftesting: z
    .string()
    .refine(
      (date) => {
        const testDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return testDate <= today;
      },
      'Test date cannot be in the future'
    ),
  
  provisionaldiagnosis: z
    .string()
    .min(3, 'Diagnosis must be at least 3 characters')
    .max(500, 'Diagnosis must be less than 500 characters'),
  
  referringphysician: z
    .string()
    .min(2, 'Physician name must be at least 2 characters')
    .max(100, 'Physician name must be less than 100 characters'),
  
  contactinfo: z
    .object({
      phone: z
        .string()
        .optional()
        .refine(
          (phone) => !phone || phoneRegex.test(phone),
          'Please enter a valid phone number'
        ),
      email: z
        .string()
        .optional()
        .refine(
          (email) => !email || emailRegex.test(email),
          'Please enter a valid email address'
        ),
      address: z
        .string()
        .max(500, 'Address must be less than 500 characters')
        .optional(),
      emergencyContact: z
        .string()
        .max(200, 'Emergency contact must be less than 200 characters')
        .optional()
    })
    .optional(),
  
  medical_history: z
    .string()
    .max(2000, 'Medical history must be less than 2000 characters')
    .optional(),
  
  allergies: z
    .string()
    .max(1000, 'Allergies must be less than 1000 characters')
    .optional(),
  
  medications: z
    .string()
    .max(1000, 'Medications must be less than 1000 characters')
    .optional()
});

// ============================================================================
// BOOKING VALIDATION
// ============================================================================

export const bookingValidationSchema = z.object({
  patientId: z
    .string()
    .uuid('Please select a valid patient'),
  
  appointmentDate: z
    .string()
    .refine(
      (date) => {
        const appointmentDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        return appointmentDate >= today;
      },
      'Appointment date cannot be in the past'
    ),
  
  appointmentTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)'),
  
  testType: z
    .enum([
      'Skin Prick Test',
      'Intradermal Test',
      'Patch Test',
      'Food Challenge Test',
      'Drug Challenge Test'
    ], {
      errorMap: () => ({ message: 'Please select a valid test type' })
    }),
  
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  
  durationMinutes: z
    .number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration must be less than 8 hours')
    .optional()
});

// ============================================================================
// ENHANCED ALLERGY TEST VALIDATION
// ============================================================================

export const allergyTestValidationSchema = z.object({
  patient_info: z.object({
    name: z
      .string()
      .min(2, 'Patient name is required'),
    
    lab_no: z
      .string()
      .min(3, 'Lab number is required'),
    
    age_sex: z
      .string()
      .regex(/^\d{1,3}\/[MFO]$/i, 'Format should be: Age/Gender (e.g., 25/M)')
      .optional(),
    
    provisional_diagnosis: z
      .string()
      .min(3, 'Diagnosis is required')
      .optional(),
    
    mrd: z
      .string()
      .max(50, 'MRD must be less than 50 characters')
      .optional(),
    
    test_date: z
      .string()
      .refine(
        (date) => {
          const testDate = new Date(date);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return testDate <= today;
        },
        'Test date cannot be in the future'
      ),
    
    referred_by: z
      .string()
      .min(2, 'Referring physician is required')
      .optional()
  }),
  
  allergen_results: z
    .record(z.string())
    .refine(
      (results) => Object.keys(results).length > 0,
      'At least one allergen result is required'
    ),
  
  controls: z.object({
    positive_control_histamine: z
      .string()
      .min(1, 'Positive control result is required'),
    
    negative_control_saline: z
      .string()
      .min(1, 'Negative control result is required')
  }),
  
  interpretation: z
    .string()
    .min(10, 'Interpretation must be at least 10 characters')
    .max(2000, 'Interpretation must be less than 2000 characters'),
  
  recommendations: z
    .string()
    .max(1000, 'Recommendations must be less than 1000 characters')
    .optional()
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export class ValidationError extends Error {
  public errors: z.ZodIssue[];
  
  constructor(errors: z.ZodIssue[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
  
  getFirstError(): string {
    return this.errors[0]?.message || 'Validation failed';
  }
  
  getErrorsForField(field: string): string[] {
    return this.errors
      .filter(error => error.path.join('.') === field)
      .map(error => error.message);
  }
  
  getAllErrors(): Record<string, string[]> {
    const errorMap: Record<string, string[]> = {};
    
    this.errors.forEach(error => {
      const field = error.path.join('.');
      if (!errorMap[field]) {
        errorMap[field] = [];
      }
      errorMap[field].push(error.message);
    });
    
    return errorMap;
  }
}

export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  
  return result.data;
}

export function validateDataAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const validatedData = validateData(schema, data);
      resolve(validatedData);
    } catch (error) {
      reject(error);
    }
  });
}

// ============================================================================
// FORM VALIDATION HOOKS
// ============================================================================

export function useValidation<T>(schema: z.ZodSchema<T>) {
  const validate = (data: unknown): { isValid: boolean; errors: Record<string, string[]>; data?: T } => {
    try {
      const validatedData = validateData(schema, data);
      return { isValid: true, errors: {}, data: validatedData };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { isValid: false, errors: error.getAllErrors() };
      }
      return { isValid: false, errors: { general: ['Validation failed'] } };
    }
  };
  
  return { validate };
}

// ============================================================================
// BUSINESS RULE VALIDATIONS
// ============================================================================

export const businessRules = {
  // Check if patient can have a new test (not more than 1 per day)
  canPatientHaveTest: (patientId: string, testDate: string): boolean => {
    // This would typically check against the database
    // For now, we'll implement basic date validation
    const today = new Date().toISOString().split('T')[0];
    return testDate <= today;
  },
  
  // Check if booking time slot is valid (working hours)
  isValidBookingTime: (time: string): boolean => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // Working hours: 8:00 AM to 6:00 PM
    const startTime = 8 * 60; // 8:00 AM
    const endTime = 18 * 60;  // 6:00 PM
    
    return totalMinutes >= startTime && totalMinutes <= endTime;
  },
  
  // Check if appointment is on a working day (Monday to Friday)
  isWorkingDay: (date: string): boolean => {
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday (1) to Friday (5)
  }
};

export default {
  patientValidationSchema,
  bookingValidationSchema,
  allergyTestValidationSchema,
  ValidationError,
  validateData,
  validateDataAsync,
  useValidation,
  businessRules
};