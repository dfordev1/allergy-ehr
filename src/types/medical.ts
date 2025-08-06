// ============================================================================
// MEDICAL DATA TYPES - COMPREHENSIVE TYPE DEFINITIONS
// ============================================================================

// ============================================================================
// CORE MEDICAL TYPES
// ============================================================================

export interface MedicalRecord {
  id: string;
  patientId: string;
  recordType: MedicalRecordType;
  date: Date;
  providerId: string;
  data: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum MedicalRecordType {
  CONSULTATION = 'consultation',
  ALLERGY_TEST = 'allergy_test',
  ENHANCED_ALLERGY_TEST = 'enhanced_allergy_test',
  FOLLOW_UP = 'follow_up',
  PRESCRIPTION = 'prescription',
  REFERRAL = 'referral'
}

// ============================================================================
// PATIENT TYPES
// ============================================================================

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: PatientSex;
  labno: string;
  dateoftesting: string;
  provisionaldiagnosis: string;
  referringphysician: string;
  contactinfo: ContactInfo;
  medicalHistory: MedicalHistory;
  allergies: KnownAllergy[];
  medications: Medication[];
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdat: string;
  updatedat: string;
}

export enum PatientSex {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  preferredLanguage?: string;
  communicationPreferences?: CommunicationPreferences;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface CommunicationPreferences {
  method: 'phone' | 'email' | 'sms' | 'mail';
  language: string;
  receiveReminders: boolean;
  receiveResults: boolean;
}

export interface MedicalHistory {
  conditions: MedicalCondition[];
  surgeries: Surgery[];
  familyHistory: FamilyHistory[];
  socialHistory: SocialHistory;
  reviewOfSystems: ReviewOfSystems;
}

export interface MedicalCondition {
  condition: string;
  diagnosedDate?: Date;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
}

export interface Surgery {
  procedure: string;
  date: Date;
  surgeon?: string;
  hospital?: string;
  complications?: string;
  notes?: string;
}

export interface FamilyHistory {
  relation: string;
  condition: string;
  ageAtDiagnosis?: number;
  ageAtDeath?: number;
  causeOfDeath?: string;
}

export interface SocialHistory {
  smoking: SmokingHistory;
  alcohol: AlcoholHistory;
  drugs: DrugHistory;
  occupation?: string;
  maritalStatus?: string;
  children?: number;
}

export interface SmokingHistory {
  status: 'never' | 'former' | 'current';
  packsPerDay?: number;
  yearsSmoked?: number;
  quitDate?: Date;
}

export interface AlcoholHistory {
  status: 'never' | 'former' | 'current' | 'social';
  drinksPerWeek?: number;
  type?: string[];
}

export interface DrugHistory {
  status: 'never' | 'former' | 'current';
  substances?: string[];
  lastUse?: Date;
}

export interface ReviewOfSystems {
  constitutional: SystemReview;
  cardiovascular: SystemReview;
  respiratory: SystemReview;
  gastrointestinal: SystemReview;
  genitourinary: SystemReview;
  musculoskeletal: SystemReview;
  neurological: SystemReview;
  psychiatric: SystemReview;
  endocrine: SystemReview;
  hematologic: SystemReview;
  dermatologic: SystemReview;
  allergicImmunologic: SystemReview;
}

export interface SystemReview {
  normal: boolean;
  symptoms?: string[];
  notes?: string;
}

export interface KnownAllergy {
  allergen: string;
  reaction: string;
  severity: AllergySeverity;
  onsetDate?: Date;
  notes?: string;
}

export enum AllergySeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  LIFE_THREATENING = 'life_threatening'
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  prescriber: string;
  indication: string;
  notes?: string;
}

// ============================================================================
// ALLERGY TESTING TYPES
// ============================================================================

export interface AllergenCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Allergen {
  id: string;
  sno: number;
  categoryId: string;
  category?: AllergenCategory;
  name: string;
  scientificName?: string;
  commonNames?: string[];
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface TestSession {
  id: string;
  patientId: string;
  patient?: Patient;
  testName: string;
  testDate: Date;
  testType: TestType;
  allergen: string;
  whealSizeMm?: number;
  testResult?: TestResult;
  notes?: string;
  technicianId?: string;
  technician?: UserProfile;
  doctorId?: string;
  doctor?: UserProfile;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum TestType {
  SKIN_PRICK = 'skin_prick',
  INTRADERMAL = 'intradermal',
  PATCH = 'patch',
  BLOOD = 'blood',
  CHALLENGE = 'challenge',
  ENHANCED = 'enhanced'
}

export enum TestResult {
  POSITIVE = 'Positive',
  NEGATIVE = 'Negative',
  INCONCLUSIVE = 'Inconclusive',
  NOT_TESTED = 'Not Tested'
}

export interface EnhancedAllergyTest {
  id: string;
  patientId: string;
  patient?: Patient;
  testDate: Date;
  patientInfo: EnhancedTestPatientInfo;
  allergenResults: AllergenTestResults;
  controls: TestControls;
  interpretation?: string;
  recommendations?: string;
  technicianId?: string;
  technician?: UserProfile;
  doctorId?: string;
  doctor?: UserProfile;
  isCompleted: boolean;
  isReviewed: boolean;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewer?: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedTestPatientInfo {
  name: string;
  labNo: string;
  ageSex: string;
  provisionalDiagnosis: string;
  mrd: string;
  dateOfTesting: string;
  referredBy: string;
}

export interface AllergenTestResults {
  [allergenSno: string]: AllergenResult;
}

export interface AllergenResult {
  whealSizeMm: string;
  testResult: TestResult | string;
  notes?: string;
  imageUrl?: string;
}

export interface TestControls {
  positiveControlHistamine: string;
  negativeControlSaline: string;
  notes?: string;
}

// ============================================================================
// BOOKING/APPOINTMENT TYPES
// ============================================================================

export interface Booking {
  id: string;
  patientId: string;
  patient?: Patient;
  appointmentDate: Date;
  appointmentTime: string;
  testType: string;
  status: BookingStatus;
  notes?: string;
  durationMinutes: number;
  assignedTechnicianId?: string;
  assignedTechnician?: UserProfile;
  assignedDoctorId?: string;
  assignedDoctor?: UserProfile;
  createdBy?: string;
  creator?: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export enum BookingStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

// ============================================================================
// USER AND ROLE TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  userId: string;
  roleId: string;
  role?: Role;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  licenseNumber?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: RolePermissions;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissions {
  patients?: string[];
  tests?: string[];
  bookings?: string[];
  users?: string[];
  roles?: string[];
  analytics?: string[];
  system?: string[];
}

export interface ActivityLog {
  id: string;
  userId?: string;
  user?: UserProfile;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  createdAt: Date;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsData {
  totalPatients: number;
  totalTests: number;
  totalBookings: number;
  recentActivity: ActivitySummary[];
  patientDemographics: DemographicData;
  testResults: TestResultSummary;
  allergenStats: AllergenStatistics[];
  monthlyTrends: MonthlyTrend[];
  testTypeStats: TestTypeStats[];
}

export interface ActivitySummary {
  date: Date;
  patients: number;
  tests: number;
  bookings: number;
}

export interface DemographicData {
  ageGroups: AgeGroupData[];
  sexDistribution: SexDistributionData[];
  referralSources: ReferralSourceData[];
}

export interface AgeGroupData {
  ageGroup: string;
  count: number;
  percentage: number;
}

export interface SexDistributionData {
  sex: string;
  count: number;
  percentage: number;
}

export interface ReferralSourceData {
  source: string;
  count: number;
  percentage: number;
}

export interface TestResultSummary {
  totalTests: number;
  positiveResults: number;
  negativeResults: number;
  inconclusiveResults: number;
  positiveRate: number;
}

export interface AllergenStatistics {
  allergen: string;
  category: string;
  totalTests: number;
  positiveResults: number;
  positiveRate: number;
}

export interface MonthlyTrend {
  month: string;
  patients: number;
  tests: number;
  positive: number;
}

export interface TestTypeStats {
  type: string;
  count: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface PatientFormData {
  name: string;
  age: number;
  sex: string;
  labno: string;
  dateoftesting: string;
  provisionaldiagnosis: string;
  referringphysician: string;
  contactinfo?: ContactInfo;
}

export interface TestFormData {
  patientId: string;
  testName: string;
  testDate: string;
  testType: string;
  allergen: string;
  whealSizeMm?: number;
  testResult?: string;
  notes?: string;
}

export interface BookingFormData {
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
  testType: string;
  notes?: string;
  durationMinutes?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  message?: string;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  error?: ApiError;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface PatientSearchFilters {
  name?: string;
  ageRange?: [number, number];
  sex?: string;
  diagnosis?: string;
  physician?: string;
  hasTests?: string;
  hasPositiveResults?: string;
  dateRange?: [string, string];
}

export interface TestSearchFilters {
  patientId?: string;
  testType?: string;
  allergen?: string;
  result?: string;
  dateRange?: [string, string];
  technicianId?: string;
  doctorId?: string;
}

export interface BookingSearchFilters {
  patientId?: string;
  status?: string;
  testType?: string;
  dateRange?: [string, string];
  technicianId?: string;
  doctorId?: string;
}

// ============================================================================
// VALIDATION SCHEMAS (for runtime validation)
// ============================================================================

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Re-export all interfaces for convenience
  MedicalRecord,
  Patient,
  ContactInfo,
  Address,
  EmergencyContact,
  CommunicationPreferences,
  MedicalHistory,
  MedicalCondition,
  Surgery,
  FamilyHistory,
  SocialHistory,
  SmokingHistory,
  AlcoholHistory,
  DrugHistory,
  ReviewOfSystems,
  SystemReview,
  KnownAllergy,
  Medication,
  AllergenCategory,
  Allergen,
  TestSession,
  EnhancedAllergyTest,
  EnhancedTestPatientInfo,
  AllergenTestResults,
  AllergenResult,
  TestControls,
  Booking,
  UserProfile,
  Role,
  RolePermissions,
  ActivityLog,
  AnalyticsData,
  ActivitySummary,
  DemographicData,
  AgeGroupData,
  SexDistributionData,
  ReferralSourceData,
  TestResultSummary,
  AllergenStatistics,
  MonthlyTrend,
  TestTypeStats,
  PatientFormData,
  TestFormData,
  BookingFormData,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationInfo,
  PatientSearchFilters,
  TestSearchFilters,
  BookingSearchFilters,
  ValidationSchema,
  ValidationRule
};