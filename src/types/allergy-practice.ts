// Comprehensive types for Allergy Practice Management System

export interface SkinTestOrder {
  id: string;
  patient_id: string;
  order_date: string;
  ordered_by: string;
  test_panels: string[];
  custom_allergens: string[];
  priority: 'routine' | 'urgent' | 'stat';
  status: 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  instructions: string;
  insurance_info?: InsuranceInfo;
  created_at: string;
  updated_at: string;
}

export interface SkinTestResult {
  id: string;
  order_id: string;
  patient_id: string;
  test_date: string;
  technician: string;
  allergen_results: AllergenResult[];
  controls: TestControls;
  interpretation: string;
  recommendations: string[];
  follow_up_needed: boolean;
  created_at: string;
}

export interface AllergenResult {
  allergen_id: string;
  allergen_name: string;
  wheal_size_mm: number;
  erythema_size_mm: number;
  result: 'negative' | 'positive_1' | 'positive_2' | 'positive_3' | 'positive_4';
  grade: number; // 0-4 scale
  notes?: string;
}

export interface TestControls {
  positive_control: {
    substance: 'histamine';
    wheal_size_mm: number;
    result: 'adequate' | 'inadequate';
  };
  negative_control: {
    substance: 'saline';
    wheal_size_mm: number;
    result: 'adequate' | 'inadequate';
  };
}

export interface CustomAllergen {
  id: string;
  name: string;
  category: string;
  source: string;
  concentration: string;
  manufacturer: string;
  lot_number: string;
  expiration_date: string;
  storage_requirements: string;
  active: boolean;
  created_by: string;
  created_at: string;
}

export interface SkinTestPanel {
  id: string;
  name: string;
  description: string;
  allergens: string[]; // allergen IDs
  category: 'environmental' | 'food' | 'drug' | 'occupational' | 'custom';
  age_restrictions?: {
    min_age?: number;
    max_age?: number;
  };
  contraindications?: string[];
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PatientHandout {
  id: string;
  patient_id: string;
  handout_type: 'allergy_education' | 'avoidance_measures' | 'emergency_action' | 'immunotherapy_info';
  title: string;
  content: string;
  allergens_mentioned: string[];
  language: string;
  generated_date: string;
  delivered_method: 'email' | 'print' | 'patient_portal';
  status: 'generated' | 'delivered' | 'read';
}

export interface ExtractOrder {
  id: string;
  patient_id: string;
  prescriber: string;
  extract_type: 'single' | 'mixed';
  allergens: ExtractAllergen[];
  concentration: string;
  volume_ml: number;
  vials_requested: number;
  mixing_instructions: string;
  rush_order: boolean;
  insurance_authorization?: string;
  status: 'ordered' | 'mixing' | 'quality_check' | 'ready' | 'shipped';
  created_at: string;
  estimated_completion: string;
}

export interface ExtractAllergen {
  allergen_id: string;
  allergen_name: string;
  concentration: string;
  ratio: number; // for mixed extracts
}

export interface VialLabel {
  id: string;
  extract_order_id: string;
  vial_number: number;
  patient_name: string;
  patient_id: string;
  allergens: string[];
  concentration: string;
  volume_ml: number;
  expiration_date: string;
  lot_number: string;
  barcode: string;
  qr_code?: string;
}

export interface ShippingLabel {
  id: string;
  extract_order_id: string;
  tracking_number: string;
  carrier: 'fedex' | 'ups' | 'usps' | 'hand_delivery';
  shipping_address: Address;
  special_handling: string[];
  temperature_requirements?: string;
  created_at: string;
  estimated_delivery: string;
}

export interface InjectionAdministration {
  id: string;
  patient_id: string;
  extract_order_id: string;
  visit_date: string;
  injection_number: number;
  dose_ml: number;
  injection_site: 'left_arm' | 'right_arm' | 'left_thigh' | 'right_thigh';
  administered_by: string;
  pre_injection_assessment: PreInjectionAssessment;
  post_injection_monitoring: PostInjectionMonitoring;
  adverse_reactions?: AdverseReaction[];
  next_appointment?: string;
  status: 'completed' | 'reaction_occurred' | 'dose_held';
}

export interface PreInjectionAssessment {
  symptoms_since_last_visit: boolean;
  symptom_details?: string;
  medications_changed: boolean;
  medication_details?: string;
  asthma_control: 'well_controlled' | 'partially_controlled' | 'uncontrolled';
  peak_flow?: number;
  vital_signs: VitalSigns;
  safe_to_proceed: boolean;
}

export interface PostInjectionMonitoring {
  observation_time_minutes: number;
  local_reaction?: LocalReaction;
  systemic_reaction?: SystemicReaction;
  vital_signs_post: VitalSigns;
  cleared_to_leave: boolean;
  instructions_given: string[];
}

export interface AdverseReaction {
  id: string;
  reaction_type: 'local' | 'systemic';
  severity: 'mild' | 'moderate' | 'severe';
  onset_time_minutes: number;
  symptoms: string[];
  treatment_given: string[];
  outcome: 'resolved' | 'ongoing' | 'hospitalized';
  reported_to_manufacturer: boolean;
  report_date?: string;
}

export interface ContactlessCheckin {
  id: string;
  patient_id: string;
  appointment_date: string;
  check_in_time: string;
  check_in_method: 'qr_code' | 'text_message' | 'app';
  symptoms_questionnaire: SymptomsQuestionnaire;
  insurance_verified: boolean;
  copay_collected: boolean;
  status: 'checked_in' | 'ready_for_provider' | 'in_progress' | 'completed';
}

export interface SymptomsQuestionnaire {
  asthma_symptoms: boolean;
  allergy_symptoms: boolean;
  new_medications: boolean;
  recent_illness: boolean;
  covid_screening: CovidScreening;
  additional_concerns?: string;
}

export interface BiologicAdministration {
  id: string;
  patient_id: string;
  medication_name: string;
  dose: string;
  administration_date: string;
  route: 'subcutaneous' | 'intramuscular' | 'intravenous';
  injection_site?: string;
  administered_by: string;
  lot_number: string;
  expiration_date: string;
  pre_medication?: string[];
  monitoring_required: boolean;
  monitoring_duration_hours?: number;
  adverse_reactions?: AdverseReaction[];
  efficacy_assessment?: EfficacyAssessment;
  next_dose_due?: string;
}

export interface AutoCharging {
  id: string;
  patient_id: string;
  service_date: string;
  procedure_codes: ProcedureCode[];
  diagnosis_codes: string[];
  units: number;
  modifier?: string;
  insurance_primary: InsuranceInfo;
  insurance_secondary?: InsuranceInfo;
  charge_amount: number;
  expected_reimbursement: number;
  status: 'pending' | 'submitted' | 'paid' | 'denied' | 'appealed';
  submission_date?: string;
  payment_date?: string;
}

export interface SpirometryResult {
  id: string;
  patient_id: string;
  test_date: string;
  technician: string;
  pre_bronchodilator: PulmonaryValues;
  post_bronchodilator?: PulmonaryValues;
  interpretation: string;
  quality_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  reversibility_percent?: number;
  recommendations: string[];
}

export interface RPMData {
  id: string;
  patient_id: string;
  device_type: 'peak_flow' | 'spirometer' | 'pulse_oximeter';
  measurement_date: string;
  values: Record<string, number>;
  symptoms_score?: number;
  medication_usage?: MedicationUsage;
  alert_triggered: boolean;
  provider_notified: boolean;
}

export interface AAAAIQCDRReport {
  id: string;
  reporting_period: string;
  measures: QualityMeasure[];
  patient_population: number;
  denominator: number;
  numerator: number;
  performance_rate: number;
  benchmark_comparison: string;
  improvement_activities: string[];
  submission_date: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
}

// Supporting interfaces
export interface InsuranceInfo {
  primary: {
    company: string;
    policy_number: string;
    group_number?: string;
    subscriber_id: string;
    authorization_required: boolean;
    authorization_number?: string;
  };
  secondary?: {
    company: string;
    policy_number: string;
    group_number?: string;
    subscriber_id: string;
  };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface VitalSigns {
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  heart_rate: number;
  respiratory_rate: number;
  temperature_f: number;
  oxygen_saturation?: number;
}

export interface LocalReaction {
  wheal_size_mm: number;
  erythema_size_mm: number;
  induration: boolean;
  itching_severity: 'none' | 'mild' | 'moderate' | 'severe';
}

export interface SystemicReaction {
  severity: 'mild' | 'moderate' | 'severe';
  symptoms: string[];
  onset_time_minutes: number;
  treatment_required: boolean;
}

export interface CovidScreening {
  fever: boolean;
  cough: boolean;
  shortness_of_breath: boolean;
  loss_of_taste_smell: boolean;
  close_contact_positive: boolean;
  recent_travel: boolean;
  cleared_for_visit: boolean;
}

export interface EfficacyAssessment {
  symptom_improvement: 'none' | 'mild' | 'moderate' | 'significant';
  quality_of_life_score: number;
  medication_reduction: boolean;
  provider_assessment: string;
}

export interface ProcedureCode {
  code: string;
  description: string;
  units: number;
  modifier?: string;
}

export interface PulmonaryValues {
  fvc_liters: number;
  fvc_percent_predicted: number;
  fev1_liters: number;
  fev1_percent_predicted: number;
  fev1_fvc_ratio: number;
  pef_liters_per_min: number;
  pef_percent_predicted: number;
}

export interface MedicationUsage {
  rescue_inhaler_puffs: number;
  controller_medication_taken: boolean;
  medication_changes: boolean;
}

export interface QualityMeasure {
  measure_id: string;
  measure_name: string;
  numerator: number;
  denominator: number;
  performance_rate: number;
  benchmark: number;
  meets_benchmark: boolean;
}

// Enums for consistency
export enum TestPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat'
}

export enum TestStatus {
  ORDERED = 'ordered',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum AllergenCategory {
  ENVIRONMENTAL = 'environmental',
  FOOD = 'food',
  DRUG = 'drug',
  OCCUPATIONAL = 'occupational',
  CUSTOM = 'custom'
}

export enum HandoutType {
  ALLERGY_EDUCATION = 'allergy_education',
  AVOIDANCE_MEASURES = 'avoidance_measures',
  EMERGENCY_ACTION = 'emergency_action',
  IMMUNOTHERAPY_INFO = 'immunotherapy_info'
}