-- ============================================================================
-- CLEANUP AND RECREATE SCRIPT
-- Purpose: Drop old tables and recreate with correct structure
-- ============================================================================

-- Drop all existing tables in the correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.enhanced_allergy_tests CASCADE;
DROP TABLE IF EXISTS public.test_sessions CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.allergens CASCADE;
DROP TABLE IF EXISTS public.allergen_categories CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS public.make_super_admin(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop indexes (they will be recreated)
DROP INDEX IF EXISTS idx_user_profiles_user_id CASCADE;
DROP INDEX IF EXISTS idx_user_profiles_role_id CASCADE;
DROP INDEX IF EXISTS idx_user_profiles_email CASCADE;
DROP INDEX IF EXISTS idx_user_profiles_active CASCADE;
DROP INDEX IF EXISTS idx_patients_labno CASCADE;
DROP INDEX IF EXISTS idx_patients_name CASCADE;
DROP INDEX IF EXISTS idx_patients_created_by CASCADE;
DROP INDEX IF EXISTS idx_patients_active CASCADE;
DROP INDEX IF EXISTS idx_patients_dateoftesting CASCADE;
DROP INDEX IF EXISTS idx_test_sessions_patient_id CASCADE;
DROP INDEX IF EXISTS idx_test_sessions_test_date CASCADE;
DROP INDEX IF EXISTS idx_test_sessions_technician_id CASCADE;
DROP INDEX IF EXISTS idx_test_sessions_doctor_id CASCADE;
DROP INDEX IF EXISTS idx_test_sessions_completed CASCADE;
DROP INDEX IF EXISTS idx_enhanced_tests_patient_id CASCADE;
DROP INDEX IF EXISTS idx_enhanced_tests_test_date CASCADE;
DROP INDEX IF EXISTS idx_enhanced_tests_technician_id CASCADE;
DROP INDEX IF EXISTS idx_enhanced_tests_doctor_id CASCADE;
DROP INDEX IF EXISTS idx_enhanced_tests_completed CASCADE;
DROP INDEX IF EXISTS idx_enhanced_tests_reviewed CASCADE;
DROP INDEX IF EXISTS idx_allergens_sno CASCADE;
DROP INDEX IF EXISTS idx_allergens_category_id CASCADE;
DROP INDEX IF EXISTS idx_allergens_active CASCADE;
DROP INDEX IF EXISTS idx_bookings_patient_id CASCADE;
DROP INDEX IF EXISTS idx_bookings_appointment_date CASCADE;
DROP INDEX IF EXISTS idx_bookings_status CASCADE;
DROP INDEX IF EXISTS idx_bookings_technician CASCADE;
DROP INDEX IF EXISTS idx_bookings_doctor CASCADE;
DROP INDEX IF EXISTS idx_activity_logs_user_id CASCADE;
DROP INDEX IF EXISTS idx_activity_logs_action CASCADE;
DROP INDEX IF EXISTS idx_activity_logs_resource_type CASCADE;
DROP INDEX IF EXISTS idx_activity_logs_created_at CASCADE;

-- Cleanup complete! Now run the core schema migration.
-- Copy and paste the content from: supabase/migrations/00_create_core_schema.sql 