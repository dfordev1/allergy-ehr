-- Enhanced Allergy Test System
-- This creates a comprehensive allergy testing database structure

-- Create allergen categories table
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
    sno INTEGER NOT NULL,
    category_id UUID REFERENCES public.allergen_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    
    -- Test Results
    test_results JSONB NOT NULL, -- Stores the complete allergen results
    controls JSONB NOT NULL, -- Stores positive/negative control results
    
    -- Test Metadata
    technician TEXT,
    test_status TEXT DEFAULT 'completed' CHECK (test_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test result details table for individual allergen results
CREATE TABLE IF NOT EXISTS public.allergen_test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID NOT NULL REFERENCES public.enhanced_allergy_tests(id) ON DELETE CASCADE,
    allergen_id UUID NOT NULL REFERENCES public.allergens(id) ON DELETE CASCADE,
    wheal_size_mm DECIMAL(4,1),
    test_result TEXT CHECK (test_result IN ('positive', 'negative', 'equivocal')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enhanced_allergy_tests_patient_id ON public.enhanced_allergy_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_allergy_tests_date ON public.enhanced_allergy_tests(date_of_testing);
CREATE INDEX IF NOT EXISTS idx_enhanced_allergy_tests_lab_no ON public.enhanced_allergy_tests(lab_no);
CREATE INDEX IF NOT EXISTS idx_allergen_test_results_test_id ON public.allergen_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_allergen_test_results_allergen_id ON public.allergen_test_results(allergen_id);
CREATE INDEX IF NOT EXISTS idx_allergens_category_id ON public.allergens(category_id);
CREATE INDEX IF NOT EXISTS idx_allergens_sno ON public.allergens(sno);

-- Enable Row Level Security (RLS)
ALTER TABLE public.allergen_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_allergy_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergen_test_results ENABLE ROW LEVEL SECURITY;

-- Create policies for allergen_categories
CREATE POLICY "Users can view allergen categories" ON public.allergen_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage allergen categories" ON public.allergen_categories
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for allergens
CREATE POLICY "Users can view allergens" ON public.allergens
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage allergens" ON public.allergens
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for enhanced_allergy_tests
CREATE POLICY "Users can view enhanced allergy tests" ON public.enhanced_allergy_tests
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert enhanced allergy tests" ON public.enhanced_allergy_tests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update enhanced allergy tests" ON public.enhanced_allergy_tests
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete enhanced allergy tests" ON public.enhanced_allergy_tests
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for allergen_test_results
CREATE POLICY "Users can view allergen test results" ON public.allergen_test_results
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage allergen test results" ON public.allergen_test_results
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_enhanced_allergy_tests_updated_at 
    BEFORE UPDATE ON public.enhanced_allergy_tests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allergens_updated_at 
    BEFORE UPDATE ON public.allergens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default allergen categories
INSERT INTO public.allergen_categories (name, description, sort_order) VALUES
('MITE', 'Dust mites and related allergens', 1),
('POLLENS', 'Various pollen allergens', 2),
('TREES', 'Tree pollen allergens', 3),
('FUNGI', 'Fungal allergens', 4),
('DUST MIX', 'Dust and particulate allergens', 5),
('EPITHELIA', 'Animal epithelia and dander', 6),
('INSECTS', 'Insect allergens', 7)
ON CONFLICT (name) DO NOTHING;

-- Insert all allergens from the provided format
INSERT INTO public.allergens (sno, category_id, name) VALUES
-- MITE
(1, (SELECT id FROM public.allergen_categories WHERE name = 'MITE'), 'D. farinae'),
(2, (SELECT id FROM public.allergen_categories WHERE name = 'MITE'), 'D. pteronyssinus'),
(3, (SELECT id FROM public.allergen_categories WHERE name = 'MITE'), 'Blomia sp.'),

-- POLLENS
(4, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Cyanodon dactylon'),
(5, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Cenchrus barbatus'),
(6, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Zea mays'),
(7, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Rye Grass'),
(8, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Meadow fescue/E. Plantain'),
(9, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Kentucky Blue Grass'),
(10, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Timothy Grass'),
(11, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Cyperus rotundus'),
(12, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Typha angustata'),
(13, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Short Ragweed'),
(14, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'P. hysterophorus'),
(15, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Amaranthus spinosus'),
(16, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Chenopodium alba'),
(17, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Mugwort'),
(18, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Ricinus communis'),
(19, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Brassica nigra'),
(20, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Mustard / Russian Thistle'),
(21, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Cannabis sativa'),
(22, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Nettle'),
(23, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Acacia arabica'),
(24, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Prosopis juliflora'),
(25, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Birch / Robinia'),

-- TREES
(26, (SELECT id FROM public.allergen_categories WHERE name = 'TREES'), 'Poplar / Eucalyptus'),

-- FUNGI
(27, (SELECT id FROM public.allergen_categories WHERE name = 'FUNGI'), 'Aspergillus fumigatus'),
(28, (SELECT id FROM public.allergen_categories WHERE name = 'FUNGI'), 'Aspergillus niger'),
(29, (SELECT id FROM public.allergen_categories WHERE name = 'FUNGI'), 'Alternaria alternata'),

-- DUST MIX
(30, (SELECT id FROM public.allergen_categories WHERE name = 'DUST MIX'), 'House Dust'),
(31, (SELECT id FROM public.allergen_categories WHERE name = 'DUST MIX'), 'Saw Dust (Wood)'),
(32, (SELECT id FROM public.allergen_categories WHERE name = 'DUST MIX'), 'Grain Dust (Rice)'),
(33, (SELECT id FROM public.allergen_categories WHERE name = 'DUST MIX'), 'Grain Dust (Wheat)'),
(34, (SELECT id FROM public.allergen_categories WHERE name = 'DUST MIX'), 'Hay Dust'),

-- EPITHELIA
(35, (SELECT id FROM public.allergen_categories WHERE name = 'EPITHELIA'), 'Cat Epithelia'),
(36, (SELECT id FROM public.allergen_categories WHERE name = 'EPITHELIA'), 'Dog Epithelia'),
(37, (SELECT id FROM public.allergen_categories WHERE name = 'EPITHELIA'), 'Chicken Feather'),
(38, (SELECT id FROM public.allergen_categories WHERE name = 'EPITHELIA'), 'Sheep''s Wool'),

-- INSECTS
(39, (SELECT id FROM public.allergen_categories WHERE name = 'INSECTS'), 'Cockroach'),
(40, (SELECT id FROM public.allergen_categories WHERE name = 'INSECTS'), 'Honey Bee'),
(41, (SELECT id FROM public.allergen_categories WHERE name = 'INSECTS'), 'Red Ant'),
(42, (SELECT id FROM public.allergen_categories WHERE name = 'INSECTS'), 'Mosquito'),
(43, (SELECT id FROM public.allergen_categories WHERE name = 'INSECTS'), 'Wasp')
ON CONFLICT (sno) DO NOTHING; 