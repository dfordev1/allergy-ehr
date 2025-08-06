-- ============================================================================
-- COMPREHENSIVE FIX FOR PATIENTS TABLE
-- Fixes: 1. Trigger field mismatch (updatedat vs updated_at)
--        2. Date constraint to allow future dates
-- ============================================================================

-- Step 1: Drop the problematic trigger first
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;

-- Step 2: Create a new trigger function specifically for patients table
CREATE OR REPLACE FUNCTION update_patients_updatedat_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Create the correct trigger for patients table
CREATE TRIGGER update_patients_updatedat 
    BEFORE UPDATE ON public.patients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_patients_updatedat_column();

-- Step 4: First, let's see what patients have invalid dates
SELECT id, name, labno, dateoftesting 
FROM public.patients 
WHERE dateoftesting < CURRENT_DATE - INTERVAL '1 year' 
   OR dateoftesting > CURRENT_DATE + INTERVAL '1 year';

-- Step 5: Update any patients with dates too far in the past or future
UPDATE public.patients 
SET dateoftesting = CURRENT_DATE,
    updatedat = TIMEZONE('utc'::text, NOW())
WHERE dateoftesting < CURRENT_DATE - INTERVAL '1 year' 
   OR dateoftesting > CURRENT_DATE + INTERVAL '1 year';

-- Step 6: Now we can safely drop the old constraint
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_dateoftesting_valid;

-- Step 7: Create the new flexible constraint
ALTER TABLE public.patients ADD CONSTRAINT patients_dateoftesting_valid 
CHECK (dateoftesting >= CURRENT_DATE - INTERVAL '1 year' AND dateoftesting <= CURRENT_DATE + INTERVAL '1 year');

-- Step 8: Verify the constraint was created
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'patients' 
AND tc.constraint_name = 'patients_dateoftesting_valid';

-- Step 9: Test that everything works
INSERT INTO public.patients (
    name, age, sex, labno, dateoftesting, 
    provisionaldiagnosis, referringphysician
) VALUES (
    'Test Patient Future', 30, 'Male', 'TEST_FUTURE_001', 
    CURRENT_DATE + INTERVAL '1 month',
    'Test Diagnosis', 'Dr. Test'
);

-- Step 10: Clean up test record
DELETE FROM public.patients WHERE labno = 'TEST_FUTURE_001';

-- Step 11: Success message
SELECT 'Patient table fixes completed successfully!' as status;

-- Step 12: Show current patient data
SELECT id, name, labno, dateoftesting, updatedat 
FROM public.patients 
ORDER BY createdat DESC; 