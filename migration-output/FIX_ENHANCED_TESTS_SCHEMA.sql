-- ============================================================================
-- FIX ENHANCED ALLERGY TESTS TABLE SCHEMA
-- Ensures the table matches the frontend expectations
-- ============================================================================

-- Step 1: Drop the existing table if it exists
DROP TABLE IF EXISTS public.enhanced_allergy_tests CASCADE;

-- Step 2: Create the correct enhanced_allergy_tests table
CREATE TABLE IF NOT EXISTS public.enhanced_allergy_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    
    -- Patient Information (matching frontend expectations)
    patient_name TEXT NOT NULL,
    lab_no TEXT NOT NULL,
    age_sex TEXT,
    provisional_diagnosis TEXT,
    mrd TEXT,
    date_of_testing DATE NOT NULL,
    referred_by TEXT,
    
    -- Test Results (JSON format as specified)
    test_results JSONB NOT NULL, -- Complete allergen results array
    controls JSONB NOT NULL, -- Positive/negative control results
    
    -- Test Metadata
    technician TEXT,
    test_status TEXT DEFAULT 'completed' CHECK (test_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_allergy_tests_patient_id ON public.enhanced_allergy_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_allergy_tests_lab_no ON public.enhanced_allergy_tests(lab_no);
CREATE INDEX IF NOT EXISTS idx_enhanced_allergy_tests_date ON public.enhanced_allergy_tests(date_of_testing);
CREATE INDEX IF NOT EXISTS idx_enhanced_allergy_tests_status ON public.enhanced_allergy_tests(test_status);

-- Step 4: Enable Row Level Security
ALTER TABLE public.enhanced_allergy_tests ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Users can view enhanced allergy tests" ON public.enhanced_allergy_tests
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert enhanced allergy tests" ON public.enhanced_allergy_tests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update enhanced allergy tests" ON public.enhanced_allergy_tests
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete enhanced allergy tests" ON public.enhanced_allergy_tests
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 6: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_enhanced_tests_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create trigger for updated_at
CREATE TRIGGER update_enhanced_tests_updated_at 
    BEFORE UPDATE ON public.enhanced_allergy_tests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_enhanced_tests_updated_at_column();

-- Step 8: Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enhanced_allergy_tests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 9: Success message
SELECT 'Enhanced allergy tests table schema fixed successfully!' as status; 