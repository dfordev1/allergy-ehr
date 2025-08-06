-- ============================================================================
-- FIX DATE CONSTRAINTS FOR SKIN TRACK AID
-- Purpose: Allow future dates for patient testing and booking appointments
-- ============================================================================

-- Drop the restrictive date constraint on patients table
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_dateoftesting_valid;

-- Create a more flexible constraint that allows future dates (up to 1 year in the future)
ALTER TABLE public.patients ADD CONSTRAINT patients_dateoftesting_valid 
CHECK (dateoftesting >= CURRENT_DATE - INTERVAL '1 year' AND dateoftesting <= CURRENT_DATE + INTERVAL '1 year');

-- Also fix the test_sessions constraint to be more flexible
ALTER TABLE public.test_sessions DROP CONSTRAINT IF EXISTS test_sessions_test_date_valid;

-- Allow test sessions up to 1 year in the future
ALTER TABLE public.test_sessions ADD CONSTRAINT test_sessions_test_date_valid 
CHECK (test_date >= CURRENT_DATE - INTERVAL '1 year' AND test_date <= CURRENT_DATE + INTERVAL '1 year');

-- Fix enhanced_allergy_tests constraint
ALTER TABLE public.enhanced_allergy_tests DROP CONSTRAINT IF EXISTS enhanced_tests_test_date_valid;

-- Allow enhanced tests up to 1 year in the future
ALTER TABLE public.enhanced_allergy_tests ADD CONSTRAINT enhanced_tests_test_date_valid 
CHECK (test_date >= CURRENT_DATE - INTERVAL '1 year' AND test_date <= CURRENT_DATE + INTERVAL '1 year');

-- Verify the constraints were updated
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('patients', 'test_sessions', 'enhanced_allergy_tests')
AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- Test that the constraints are working by trying to insert a test record
DO $$
BEGIN
    -- Test insert with future date
    INSERT INTO public.patients (
        name, age, sex, labno, dateoftesting, 
        provisionaldiagnosis, referringphysician
    ) VALUES (
        'Test Patient Future', 30, 'Male', 'TEST_FUTURE_001', 
        CURRENT_DATE + INTERVAL '1 month',
        'Test Diagnosis', 'Dr. Test'
    );
    
    -- Clean up test record
    DELETE FROM public.patients WHERE labno = 'TEST_FUTURE_001';
    
    RAISE NOTICE 'Date constraints are now working correctly! Future dates are allowed.';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing date constraints: %', SQLERRM;
END $$; 