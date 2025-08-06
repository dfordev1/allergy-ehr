// ============================================================================
// COMPREHENSIVE ERROR HANDLING SYSTEM
// ============================================================================

import { toast } from 'sonner';

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum ErrorCode {
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Database Errors
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  DATABASE_CONSTRAINT = 'DATABASE_CONSTRAINT',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  
  // Business Logic Errors
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  TEST_ALREADY_EXISTS = 'TEST_ALREADY_EXISTS',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // System Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  
  // Medical Specific
  INVALID_MEDICAL_DATA = 'INVALID_MEDICAL_DATA',
  HIPAA_VIOLATION = 'HIPAA_VIOLATION',
  AUDIT_REQUIRED = 'AUDIT_REQUIRED'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  details?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  context?: string;
  stack?: string;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly sessionId?: string;
  public readonly context?: string;

  constructor(
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    details?: Record<string, any>,
    context?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date();
    this.context = context;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      userId: this.userId,
      sessionId: this.sessionId,
      context: this.context,
      stack: this.stack
    };
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, ErrorSeverity.LOW, details, 'Validation');
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.UNAUTHORIZED, message, ErrorSeverity.HIGH, details, 'Authentication');
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.DATABASE_CONNECTION, message, ErrorSeverity.HIGH, details, 'Database');
  }
}

export class BusinessLogicError extends BaseError {
  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(code, message, ErrorSeverity.MEDIUM, details, 'Business Logic');
  }
}

export class MedicalDataError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.INVALID_MEDICAL_DATA, message, ErrorSeverity.HIGH, details, 'Medical Data');
  }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle different types of errors
  public handleError(error: unknown, context?: string): AppError {
    let appError: AppError;

    if (error instanceof BaseError) {
      appError = error.toJSON();
    } else if (error instanceof Error) {
      appError = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: error.message,
        severity: ErrorSeverity.MEDIUM,
        timestamp: new Date(),
        context,
        stack: error.stack
      };
    } else {
      appError = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'An unknown error occurred',
        severity: ErrorSeverity.MEDIUM,
        timestamp: new Date(),
        context,
        details: { originalError: error }
      };
    }

    // Log error
    this.logError(appError);
    
    // Add to queue for batch processing
    this.addToQueue(appError);
    
    // Show user notification based on severity
    this.showUserNotification(appError);
    
    return appError;
  }

  // Handle Supabase specific errors
  public handleSupabaseError(error: unknown, context?: string): AppError {
    let code = ErrorCode.DATABASE_CONNECTION;
    let severity = ErrorSeverity.HIGH;
    let message = 'Database operation failed';

    if (error?.code) {
      switch (error.code) {
        case '23505': // Unique violation
          code = ErrorCode.DUPLICATE_RECORD;
          message = 'Record already exists';
          severity = ErrorSeverity.LOW;
          break;
        case '23503': // Foreign key violation
          code = ErrorCode.DATABASE_CONSTRAINT;
          message = 'Invalid reference to related record';
          severity = ErrorSeverity.MEDIUM;
          break;
        case '42P01': // Table does not exist
          code = ErrorCode.DATABASE_CONNECTION;
          message = 'Database table not found - please run migrations';
          severity = ErrorSeverity.CRITICAL;
          break;
        case 'PGRST116': // No rows found
          code = ErrorCode.RECORD_NOT_FOUND;
          message = 'Record not found';
          severity = ErrorSeverity.LOW;
          break;
        default:
          message = error.message || 'Database error occurred';
      }
    }

    const appError: AppError = {
      code,
      message,
      severity,
      timestamp: new Date(),
      context: context || 'Supabase',
      details: {
        supabaseCode: error?.code,
        supabaseMessage: error?.message,
        supabaseDetails: error?.details
      }
    };

    return this.handleError(new BaseError(code, message, severity, appError.details), context);
  }

  // Handle network errors
  public handleNetworkError(error: unknown, context?: string): AppError {
    const appError: AppError = {
      code: ErrorCode.NETWORK_ERROR,
      message: 'Network connection failed',
      severity: ErrorSeverity.HIGH,
      timestamp: new Date(),
      context: context || 'Network',
      details: {
        status: error?.status,
        statusText: error?.statusText,
        url: error?.config?.url
      }
    };

    return this.handleError(new BaseError(ErrorCode.NETWORK_ERROR, appError.message, ErrorSeverity.HIGH, appError.details), context);
  }

  // Log error to console and external services
  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.code}] ${error.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage, error);
        break;
      case 'warn':
        console.warn(logMessage, error);
        break;
      case 'info':
        console.info(logMessage, error);
        break;
      default:
        console.log(logMessage, error);
    }

    // TODO: Send to external logging service (Sentry, LogRocket, etc.)
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.sendToCriticalErrorService(error);
    }
  }

  // Show appropriate user notification
  private showUserNotification(error: AppError): void {
    const userMessage = this.getUserFriendlyMessage(error);
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(userMessage, {
          duration: 10000,
          action: {
            label: 'Report Issue',
            onClick: () => this.reportIssue(error)
          }
        });
        break;
      case ErrorSeverity.HIGH:
        toast.error(userMessage, { duration: 5000 });
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(userMessage, { duration: 3000 });
        break;
      case ErrorSeverity.LOW:
        toast.info(userMessage, { duration: 2000 });
        break;
    }
  }

  // Convert technical error to user-friendly message
  private getUserFriendlyMessage(error: AppError): string {
    const messageMap: Record<ErrorCode, string> = {
      [ErrorCode.UNAUTHORIZED]: 'Please log in to continue',
      [ErrorCode.FORBIDDEN]: 'You don\'t have permission to perform this action',
      [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please log in again',
      [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
      [ErrorCode.DATABASE_CONNECTION]: 'Unable to connect to the database. Please try again later',
      [ErrorCode.DATABASE_CONSTRAINT]: 'Data validation error. Please check your input',
      [ErrorCode.RECORD_NOT_FOUND]: 'The requested record was not found',
      [ErrorCode.DUPLICATE_RECORD]: 'This record already exists',
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
      [ErrorCode.REQUIRED_FIELD]: 'Please fill in all required fields',
      [ErrorCode.INVALID_FORMAT]: 'Please enter data in the correct format',
      [ErrorCode.OUT_OF_RANGE]: 'Value is outside the allowed range',
      [ErrorCode.PATIENT_NOT_FOUND]: 'Patient not found',
      [ErrorCode.TEST_ALREADY_EXISTS]: 'A test already exists for this patient',
      [ErrorCode.BOOKING_CONFLICT]: 'This time slot is already booked',
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You don\'t have permission for this action',
      [ErrorCode.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection',
      [ErrorCode.SERVER_ERROR]: 'Server error occurred. Please try again later',
      [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred',
      [ErrorCode.INVALID_MEDICAL_DATA]: 'Invalid medical data format',
      [ErrorCode.HIPAA_VIOLATION]: 'Data access violation detected',
      [ErrorCode.AUDIT_REQUIRED]: 'This action requires audit logging'
    };

    return messageMap[error.code] || error.message;
  }

  // Get appropriate log level
  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  // Add error to processing queue
  private addToQueue(error: AppError): void {
    this.errorQueue.push(error);
    
    // Prevent queue overflow
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  // Send critical errors to external service
  private sendToCriticalErrorService(error: AppError): void {
    // TODO: Implement external error reporting
    console.error('CRITICAL ERROR:', error);
  }

  // Report issue functionality
  private reportIssue(error: AppError): void {
    // TODO: Open support ticket or feedback form
    console.log('Reporting issue:', error);
  }

  // Get error statistics
  public getErrorStats(): { total: number; bySeverity: Record<ErrorSeverity, number>; byCode: Record<ErrorCode, number> } {
    const stats = {
      total: this.errorQueue.length,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byCode: {} as Record<ErrorCode, number>
    };

    // Initialize counters
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });
    Object.values(ErrorCode).forEach(code => {
      stats.byCode[code] = 0;
    });

    // Count errors
    this.errorQueue.forEach(error => {
      stats.bySeverity[error.severity]++;
      stats.byCode[error.code]++;
    });

    return stats;
  }

  // Clear error queue
  public clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const errorHandler = ErrorHandler.getInstance();

export const handleError = (error: unknown, context?: string): AppError => {
  return errorHandler.handleError(error, context);
};

export const handleSupabaseError = (error: unknown, context?: string): AppError => {
  return errorHandler.handleSupabaseError(error, context);
};

export const handleNetworkError = (error: unknown, context?: string): AppError => {
  return errorHandler.handleNetworkError(error, context);
};

// Validation helpers
export const validateRequired = (value: unknown, fieldName: string): void => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${fieldName} is required`);
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validateAge = (age: number): void => {
  if (age < 0 || age > 150) {
    throw new ValidationError('Age must be between 0 and 150');
  }
};

export const validateLabNumber = (labNo: string): void => {
  if (!labNo || labNo.trim().length < 3) {
    throw new ValidationError('Lab number must be at least 3 characters');
  }
};

// Medical data validation
export const validateMedicalData = (data: unknown): void => {
  if (!data || typeof data !== 'object') {
    throw new MedicalDataError('Invalid medical data format');
  }
};

export const validateWheelSize = (size: number): void => {
  if (size < 0 || size > 50) {
    throw new ValidationError('Wheal size must be between 0 and 50mm');
  }
};