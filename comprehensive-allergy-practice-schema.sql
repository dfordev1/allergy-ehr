-- ==========================================
-- COMPREHENSIVE ALLERGY PRACTICE MANAGEMENT SYSTEM
-- Database Schema Migration
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== SKIN TEST ORDERS & RESULTS ====================

-- Skin Test Orders Table
CREATE TABLE IF NOT EXISTS public.skin_test_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ordered_by TEXT NOT NULL,
    test_panels TEXT[] DEFAULT '{}',
    custom_allergens TEXT[] DEFAULT '{}',
    priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
    status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    instructions TEXT,
    insurance_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skin Test Results Table
CREATE TABLE IF NOT EXISTS public.skin_test_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.skin_test_orders(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    test_date TIMESTAMP WITH TIME ZONE NOT NULL,
    technician TEXT NOT NULL,
    allergen_results JSONB NOT NULL DEFAULT '[]',
    controls JSONB NOT NULL DEFAULT '{}',
    interpretation TEXT,
    recommendations TEXT[] DEFAULT '{}',
    follow_up_needed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== CUSTOM ALLERGENS & PANELS ====================

-- Custom Allergens Table
CREATE TABLE IF NOT EXISTS public.custom_allergens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT,
    concentration TEXT NOT NULL,
    manufacturer TEXT,
    lot_number TEXT,
    expiration_date DATE,
    storage_requirements TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, concentration)
);

-- Skin Test Panels Table
CREATE TABLE IF NOT EXISTS public.skin_test_panels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    allergens TEXT[] DEFAULT '{}',
    category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN ('environmental', 'food', 'drug', 'occupational', 'custom')),
    age_restrictions JSONB,
    contraindications TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== PATIENT HANDOUTS ====================

-- Patient Handouts Table
CREATE TABLE IF NOT EXISTS public.patient_handouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    handout_type TEXT NOT NULL CHECK (handout_type IN ('allergy_education', 'avoidance_measures', 'emergency_action', 'immunotherapy_info')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    allergens_mentioned TEXT[] DEFAULT '{}',
    language TEXT DEFAULT 'en',
    generated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_method TEXT CHECK (delivered_method IN ('email', 'print', 'patient_portal')),
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'delivered', 'read'))
);

-- ==================== EXTRACT ORDERS & VIAL MIXING ====================

-- Extract Orders Table
CREATE TABLE IF NOT EXISTS public.extract_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    prescriber TEXT NOT NULL,
    extract_type TEXT NOT NULL CHECK (extract_type IN ('single', 'mixed')),
    allergens JSONB NOT NULL DEFAULT '[]',
    concentration TEXT NOT NULL,
    volume_ml DECIMAL(5,2) NOT NULL,
    vials_requested INTEGER NOT NULL DEFAULT 1,
    mixing_instructions TEXT,
    rush_order BOOLEAN DEFAULT FALSE,
    insurance_authorization TEXT,
    status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'mixing', 'quality_check', 'ready', 'shipped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estimated_completion TIMESTAMP WITH TIME ZONE
);

-- Vial Labels Table
CREATE TABLE IF NOT EXISTS public.vial_labels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    extract_order_id UUID NOT NULL REFERENCES public.extract_orders(id) ON DELETE CASCADE,
    vial_number INTEGER NOT NULL,
    patient_name TEXT NOT NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    allergens TEXT[] NOT NULL,
    concentration TEXT NOT NULL,
    volume_ml DECIMAL(5,2) NOT NULL,
    expiration_date DATE NOT NULL,
    lot_number TEXT NOT NULL,
    barcode TEXT UNIQUE,
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping Labels Table
CREATE TABLE IF NOT EXISTS public.shipping_labels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    extract_order_id UUID NOT NULL REFERENCES public.extract_orders(id) ON DELETE CASCADE,
    tracking_number TEXT UNIQUE,
    carrier TEXT NOT NULL CHECK (carrier IN ('fedex', 'ups', 'usps', 'hand_delivery')),
    shipping_address JSONB NOT NULL,
    special_handling TEXT[] DEFAULT '{}',
    temperature_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estimated_delivery TIMESTAMP WITH TIME ZONE
);

-- ==================== INJECTION ADMINISTRATION ====================

-- Injection Administrations Table
CREATE TABLE IF NOT EXISTS public.injection_administrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    extract_order_id UUID REFERENCES public.extract_orders(id),
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    injection_number INTEGER NOT NULL,
    dose_ml DECIMAL(4,3) NOT NULL,
    injection_site TEXT NOT NULL CHECK (injection_site IN ('left_arm', 'right_arm', 'left_thigh', 'right_thigh')),
    administered_by TEXT NOT NULL,
    pre_injection_assessment JSONB NOT NULL DEFAULT '{}',
    post_injection_monitoring JSONB NOT NULL DEFAULT '{}',
    adverse_reactions JSONB DEFAULT '[]',
    next_appointment TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'reaction_occurred', 'dose_held'))
);

-- ==================== CONTACTLESS CHECK-IN ====================

-- Contactless Check-ins Table
CREATE TABLE IF NOT EXISTS public.contactless_checkins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_in_method TEXT NOT NULL CHECK (check_in_method IN ('qr_code', 'text_message', 'app')),
    symptoms_questionnaire JSONB NOT NULL DEFAULT '{}',
    insurance_verified BOOLEAN DEFAULT FALSE,
    copay_collected BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'ready_for_provider', 'in_progress', 'completed'))
);

-- ==================== BIOLOGIC ADMINISTRATION ====================

-- Biologic Administrations Table
CREATE TABLE IF NOT EXISTS public.biologic_administrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dose TEXT NOT NULL,
    administration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    route TEXT NOT NULL CHECK (route IN ('subcutaneous', 'intramuscular', 'intravenous')),
    injection_site TEXT,
    administered_by TEXT NOT NULL,
    lot_number TEXT NOT NULL,
    expiration_date DATE NOT NULL,
    pre_medication TEXT[] DEFAULT '{}',
    monitoring_required BOOLEAN DEFAULT TRUE,
    monitoring_duration_hours INTEGER,
    adverse_reactions JSONB DEFAULT '[]',
    efficacy_assessment JSONB,
    next_dose_due TIMESTAMP WITH TIME ZONE
);

-- ==================== AUTO-CHARGING ====================

-- Auto Charging Table
CREATE TABLE IF NOT EXISTS public.auto_charging (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    procedure_codes JSONB NOT NULL DEFAULT '[]',
    diagnosis_codes TEXT[] NOT NULL,
    units INTEGER NOT NULL DEFAULT 1,
    modifier TEXT,
    insurance_primary JSONB NOT NULL,
    insurance_secondary JSONB,
    charge_amount DECIMAL(10,2) NOT NULL,
    expected_reimbursement DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'paid', 'denied', 'appealed')),
    submission_date TIMESTAMP WITH TIME ZONE,
    payment_date TIMESTAMP WITH TIME ZONE
);

-- ==================== SPIROMETRY & RPM ====================

-- Spirometry Results Table
CREATE TABLE IF NOT EXISTS public.spirometry_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    technician TEXT NOT NULL,
    pre_bronchodilator JSONB NOT NULL,
    post_bronchodilator JSONB,
    interpretation TEXT NOT NULL,
    quality_grade TEXT NOT NULL CHECK (quality_grade IN ('A', 'B', 'C', 'D', 'F')),
    reversibility_percent DECIMAL(5,2),
    recommendations TEXT[] DEFAULT '{}'
);

-- RPM Data Table
CREATE TABLE IF NOT EXISTS public.rpm_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL CHECK (device_type IN ('peak_flow', 'spirometer', 'pulse_oximeter')),
    measurement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    values JSONB NOT NULL DEFAULT '{}',
    symptoms_score INTEGER,
    medication_usage JSONB,
    alert_triggered BOOLEAN DEFAULT FALSE,
    provider_notified BOOLEAN DEFAULT FALSE
);

-- ==================== AAAAI QCDR INTEGRATION ====================

-- AAAAI QCDR Reports Table
CREATE TABLE IF NOT EXISTS public.aaaai_qcdr_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporting_period TEXT NOT NULL,
    measures JSONB NOT NULL DEFAULT '[]',
    patient_population INTEGER NOT NULL,
    denominator INTEGER NOT NULL,
    numerator INTEGER NOT NULL,
    performance_rate DECIMAL(5,2) NOT NULL,
    benchmark_comparison TEXT,
    improvement_activities TEXT[] DEFAULT '{}',
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected'))
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Skin Test Orders indexes
CREATE INDEX IF NOT EXISTS idx_skin_test_orders_patient_id ON public.skin_test_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_skin_test_orders_status ON public.skin_test_orders(status);
CREATE INDEX IF NOT EXISTS idx_skin_test_orders_order_date ON public.skin_test_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_skin_test_orders_priority ON public.skin_test_orders(priority);

-- Skin Test Results indexes
CREATE INDEX IF NOT EXISTS idx_skin_test_results_patient_id ON public.skin_test_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_skin_test_results_order_id ON public.skin_test_results(order_id);
CREATE INDEX IF NOT EXISTS idx_skin_test_results_test_date ON public.skin_test_results(test_date);

-- Custom Allergens indexes
CREATE INDEX IF NOT EXISTS idx_custom_allergens_category ON public.custom_allergens(category);
CREATE INDEX IF NOT EXISTS idx_custom_allergens_active ON public.custom_allergens(active);
CREATE INDEX IF NOT EXISTS idx_custom_allergens_expiration ON public.custom_allergens(expiration_date);

-- Extract Orders indexes
CREATE INDEX IF NOT EXISTS idx_extract_orders_patient_id ON public.extract_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_extract_orders_status ON public.extract_orders(status);
CREATE INDEX IF NOT EXISTS idx_extract_orders_created_at ON public.extract_orders(created_at);

-- Injection Administrations indexes
CREATE INDEX IF NOT EXISTS idx_injection_administrations_patient_id ON public.injection_administrations(patient_id);
CREATE INDEX IF NOT EXISTS idx_injection_administrations_visit_date ON public.injection_administrations(visit_date);

-- Contactless Check-ins indexes
CREATE INDEX IF NOT EXISTS idx_contactless_checkins_patient_id ON public.contactless_checkins(patient_id);
CREATE INDEX IF NOT EXISTS idx_contactless_checkins_appointment_date ON public.contactless_checkins(appointment_date);
CREATE INDEX IF NOT EXISTS idx_contactless_checkins_status ON public.contactless_checkins(status);

-- Biologic Administrations indexes
CREATE INDEX IF NOT EXISTS idx_biologic_administrations_patient_id ON public.biologic_administrations(patient_id);
CREATE INDEX IF NOT EXISTS idx_biologic_administrations_date ON public.biologic_administrations(administration_date);

-- Auto Charging indexes
CREATE INDEX IF NOT EXISTS idx_auto_charging_patient_id ON public.auto_charging(patient_id);
CREATE INDEX IF NOT EXISTS idx_auto_charging_status ON public.auto_charging(status);
CREATE INDEX IF NOT EXISTS idx_auto_charging_service_date ON public.auto_charging(service_date);

-- RPM Data indexes
CREATE INDEX IF NOT EXISTS idx_rpm_data_patient_id ON public.rpm_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_rpm_data_measurement_date ON public.rpm_data(measurement_date);
CREATE INDEX IF NOT EXISTS idx_rpm_data_device_type ON public.rpm_data(device_type);

-- ==================== RLS POLICIES ====================

-- Enable RLS on all tables
ALTER TABLE public.skin_test_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_test_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_handouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extract_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vial_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injection_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactless_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biologic_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_charging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spirometry_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpm_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aaaai_qcdr_reports ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users (can be refined later)
DO $$ 
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'skin_test_orders', 'skin_test_results', 'custom_allergens', 'skin_test_panels',
        'patient_handouts', 'extract_orders', 'vial_labels', 'shipping_labels',
        'injection_administrations', 'contactless_checkins', 'biologic_administrations',
        'auto_charging', 'spirometry_results', 'rpm_data', 'aaaai_qcdr_reports'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.%I;
            CREATE POLICY "Allow all operations for authenticated users" ON public.%I
                FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'');
        ', table_name, table_name);
    END LOOP;
END $$;

-- ==================== SAMPLE DATA ====================

-- Insert sample custom allergens
INSERT INTO public.custom_allergens (name, category, concentration, manufacturer, active) VALUES
('House Dust Mite Mix', 'Environmental', '10,000 AU/mL', 'ALK-Abello', true),
('Cat Epithelium', 'Environmental', '10,000 BAU/mL', 'Greer Labs', true),
('Dog Epithelium', 'Environmental', '10,000 BAU/mL', 'Greer Labs', true),
('Ragweed Mix', 'Environmental', '10,000 BAU/mL', 'Hollister-Stier', true),
('Tree Pollen Mix', 'Environmental', '10,000 BAU/mL', 'Hollister-Stier', true),
('Grass Pollen Mix', 'Environmental', '10,000 BAU/mL', 'Hollister-Stier', true),
('Penicillin G', 'Drug', '1,000 U/mL', 'Custom Mix', true),
('Latex', 'Occupational', '1:20 w/v', 'Greer Labs', true)
ON CONFLICT (name, concentration) DO NOTHING;

-- Insert sample test panels
INSERT INTO public.skin_test_panels (name, description, allergens, category, active) VALUES
('Environmental Standard Panel', 'Comprehensive environmental allergen testing', 
 ARRAY['House Dust Mite Mix', 'Cat Epithelium', 'Dog Epithelium', 'Ragweed Mix', 'Tree Pollen Mix', 'Grass Pollen Mix'], 
 'environmental', true),
('Drug Allergy Panel', 'Common drug allergen testing', 
 ARRAY['Penicillin G'], 
 'drug', true),
('Occupational Panel', 'Workplace allergen testing', 
 ARRAY['Latex'], 
 'occupational', true)
ON CONFLICT (name) DO NOTHING;

-- ==================== FUNCTIONS & TRIGGERS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers where applicable
CREATE TRIGGER update_skin_test_orders_updated_at 
    BEFORE UPDATE ON public.skin_test_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skin_test_panels_updated_at 
    BEFORE UPDATE ON public.skin_test_panels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate barcode for vial labels
CREATE OR REPLACE FUNCTION generate_vial_barcode()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.barcode IS NULL THEN
        NEW.barcode := 'VL' || EXTRACT(EPOCH FROM NOW())::BIGINT || LPAD(NEW.vial_number::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_vial_barcode_trigger
    BEFORE INSERT ON public.vial_labels
    FOR EACH ROW EXECUTE FUNCTION generate_vial_barcode();

-- ==================== COMPLETION MESSAGE ====================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'COMPREHENSIVE ALLERGY PRACTICE MANAGEMENT';
    RAISE NOTICE 'Database Schema Setup Complete!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Created Tables:';
    RAISE NOTICE '✓ Skin Test Orders & Results';
    RAISE NOTICE '✓ Custom Allergens & Test Panels';
    RAISE NOTICE '✓ Patient Handouts';
    RAISE NOTICE '✓ Extract Orders & Vial Management';
    RAISE NOTICE '✓ Injection Administration';
    RAISE NOTICE '✓ Contactless Check-in';
    RAISE NOTICE '✓ Biologic Administration';
    RAISE NOTICE '✓ Auto-charging';
    RAISE NOTICE '✓ Spirometry & RPM';
    RAISE NOTICE '✓ AAAAI QCDR Reports';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test the new Practice Management dashboard';
    RAISE NOTICE '2. Create your first skin test order';
    RAISE NOTICE '3. Set up custom allergens and panels';
    RAISE NOTICE '===========================================';
END $$;