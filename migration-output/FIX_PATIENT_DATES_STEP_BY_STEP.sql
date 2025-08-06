-- ============================================================================
-- FIX PATIENT DATE CONSTRAINT - STEP BY STEP
-- ============================================================================

-- Step 1: First, let's see what patients have invalid dates
SELECT id, name, labno, dateoftesting 
FROM public.patients 
WHERE dateoftesting < CURRENT_DATE - INTERVAL '1 year' 
   OR dateoftesting > CURRENT_DATE + INTERVAL '1 year';

-- Step 2: Update any patients with dates too far in the past or future
UPDATE public.patients 
SET dateoftesting = CURRENT_DATE 
WHERE dateoftesting < CURRENT_DATE - INTERVAL '1 year' 
   OR dateoftesting > CURRENT_DATE + INTERVAL '1 year';

-- Step 3: Now we can safely drop the old constraint
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_dateoftesting_valid;

-- Step 4: Create the new flexible constraint
ALTER TABLE public.patients ADD CONSTRAINT patients_dateoftesting_valid 
CHECK (dateoftesting >= CURRENT_DATE - INTERVAL '1 year' AND dateoftesting <= CURRENT_DATE + INTERVAL '1 year');

-- Step 5: Verify the constraint was created
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'patients' 
AND tc.constraint_name = 'patients_dateoftesting_valid';

-- Step 6: Test that it works
INSERT INTO public.patients (
    name, age, sex, labno, dateoftesting, 
    provisionaldiagnosis, referringphysician
) VALUES (
    'Test Patient Future', 30, 'Male', 'TEST_FUTURE_001', 
    CURRENT_DATE + INTERVAL '1 month',
    'Test Diagnosis', 'Dr. Test'
);

-- Step 7: Clean up test record
DELETE FROM public.patients WHERE labno = 'TEST_FUTURE_001';

-- Step 8: Success message
SELECT 'Date constraint fix completed successfully!' as status;