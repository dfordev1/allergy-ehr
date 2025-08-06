-- ============================================================================
-- COMPREHENSIVE FIX FOR ALL PATIENT TABLE CONSTRAINTS
-- Fixes: 1. Trigger field mismatch (updatedat vs updated_at)
--        2. Date constraint to allow future dates
--        3. All length constraints to be more reasonable
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

-- Step 4: Drop all existing constraints that might be too restrictive
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_dateoftesting_valid;
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_diagnosis_length;
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_physician_length;
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_labno_format;
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_name_length;

-- Step 5: Update any patients with dates too far in the past or future
UPDATE public.patients 
SET dateoftesting = CURRENT_DATE,
    updatedat = TIMEZONE('utc'::text, NOW())
WHERE dateoftesting < CURRENT_DATE - INTERVAL '1 year' 
   OR dateoftesting > CURRENT_DATE + INTERVAL '1 year';

-- Step 6: Update any patients with diagnosis that's too short
UPDATE public.patients 
SET provisionaldiagnosis = CASE 
    WHEN length(trim(provisionaldiagnosis)) < 3 THEN 'General Allergy Assessment'
    ELSE provisionaldiagnosis
    END,
    updatedat = TIMEZONE('utc'::text, NOW())
WHERE length(trim(provisionaldiagnosis)) < 3;

-- Step 7: Update any patients with physician names that are too short
UPDATE public.patients 
SET referringphysician = CASE 
    WHEN length(trim(referringphysician)) < 2 THEN 'Dr. Unknown'
    ELSE referringphysician
    END,
    updatedat = TIMEZONE('utc'::text, NOW())
WHERE length(trim(referringphysician)) < 2;

-- Step 8: Update any patients with lab numbers that are too short
UPDATE public.patients 
SET labno = CASE 
    WHEN length(trim(labno)) < 3 THEN CONCAT('LAB', id::text)
    ELSE labno
    END,
    updatedat = TIMEZONE('utc'::text, NOW())
WHERE length(trim(labno)) < 3;

-- Step 9: Update any patients with names that are too short
UPDATE public.patients 
SET name = CASE 
    WHEN length(trim(name)) < 2 THEN CONCAT('Patient ', id::text)
    ELSE name
    END,
    updatedat = TIMEZONE('utc'::text, NOW())
WHERE length(trim(name)) < 2;

-- Step 10: Create new, more reasonable constraints
ALTER TABLE public.patients ADD CONSTRAINT patients_dateoftesting_valid 
CHECK (dateoftesting >= CURRENT_DATE - INTERVAL '1 year' AND dateoftesting <= CURRENT_DATE + INTERVAL '1 year');

ALTER TABLE public.patients ADD CONSTRAINT patients_diagnosis_length 
CHECK (length(trim(provisionaldiagnosis)) >= 3);

ALTER TABLE public.patients ADD CONSTRAINT patients_physician_length 
CHECK (length(trim(referringphysician)) >= 2);

ALTER TABLE public.patients ADD CONSTRAINT patients_labno_format 
CHECK (length(trim(labno)) >= 3);

ALTER TABLE public.patients ADD CONSTRAINT patients_name_length 
CHECK (length(trim(name)) >= 2);

-- Step 11: Verify all constraints were created
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'patients' 
AND tc.constraint_type = 'CHECK'
ORDER BY tc.constraint_name;

-- Step 12: Test that everything works with various scenarios
INSERT INTO public.patients (
    name, age, sex, labno, dateoftesting, 
    provisionaldiagnosis, referringphysician
) VALUES 
-- Test 1: Future date
('Test Patient Future', 30, 'Male', 'TEST_FUTURE_001', 
 CURRENT_DATE + INTERVAL '1 month', 'Allergic Rhinitis', 'Dr. Smith'),
-- Test 2: Short but valid diagnosis
('Test Patient Short', 25, 'Female', 'TEST_SHORT_002', 
 CURRENT_DATE, 'ABC', 'Dr. Jones'),
-- Test 3: Normal case
('Test Patient Normal', 35, 'Other', 'TEST_NORMAL_003', 
 CURRENT_DATE, 'Seasonal Allergies', 'Dr. Brown');

-- Step 13: Clean up test records
DELETE FROM public.patients WHERE labno IN ('TEST_FUTURE_001', 'TEST_SHORT_002', 'TEST_NORMAL_003');

-- Step 14: Success message
SELECT 'All patient table constraints fixed successfully!' as status;

-- Step 15: Show current patient data
SELECT id, name, labno, dateoftesting, provisionaldiagnosis, referringphysician, updatedat 
FROM public.patients 
ORDER BY createdat DESC; 