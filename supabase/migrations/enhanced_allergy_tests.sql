-- Enhanced Allergy Test System Schema

-- Create allergen categories
CREATE TABLE IF NOT EXISTS public.allergen_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create allergens table
CREATE TABLE IF NOT EXISTS public.allergens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sno INTEGER NOT NULL UNIQUE,
    category_id UUID REFERENCES public.allergen_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced allergy tests table
CREATE TABLE IF NOT EXISTS public.enhanced_allergy_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    
    -- Patient Information
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_allergy_tests_patient_id ON public.enhanced_allergy_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_allergy_tests_lab_no ON public.enhanced_allergy_tests(lab_no);
CREATE INDEX IF NOT EXISTS idx_allergens_category_id ON public.allergens(category_id);

-- Enable RLS
ALTER TABLE public.allergen_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_allergy_tests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage allergen data" ON public.allergen_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage allergens" ON public.allergens FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage allergy tests" ON public.enhanced_allergy_tests FOR ALL USING (auth.role() = 'authenticated');

-- Insert default categories
INSERT INTO public.allergen_categories (name, description, sort_order) VALUES
('MITE', 'Dust mites and related allergens', 1),
('POLLENS', 'Various pollen allergens', 2),
('TREES', 'Tree pollen allergens', 3),
('FUNGI', 'Fungal allergens', 4),
('DUST MIX', 'Dust and particulate allergens', 5),
('EPITHELIA', 'Animal epithelia and dander', 6),
('INSECTS', 'Insect allergens', 7)
ON CONFLICT (name) DO NOTHING; 