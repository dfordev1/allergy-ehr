-- ============================================================================
-- ALLERGYEHR CORE DATABASE SCHEMA
-- Version: 2.0
-- Purpose: Create a rock-solid foundation for the AllergyEHR system
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Roles table with proper constraints
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT roles_name_length CHECK (length(name) >= 2),
    CONSTRAINT roles_display_name_length CHECK (length(display_name) >= 2),
    CONSTRAINT roles_permissions_valid CHECK (jsonb_typeof(permissions) = 'object')
);

-- User profiles with enhanced validation
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(100),
    license_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT user_profiles_first_name_length CHECK (length(trim(first_name)) >= 1),
    CONSTRAINT user_profiles_last_name_length CHECK (length(trim(last_name)) >= 1),
    CONSTRAINT user_profiles_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT user_profiles_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

-- Patients table with comprehensive validation
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    sex VARCHAR(10) NOT NULL,
    labno VARCHAR(50) NOT NULL UNIQUE,
    dateoftesting DATE NOT NULL,
    provisionaldiagnosis TEXT NOT NULL,
    referringphysician VARCHAR(255) NOT NULL,
    contactinfo JSONB DEFAULT '{}',
    medical_history JSONB DEFAULT '{}',
    allergies JSONB DEFAULT '[]',
    medications JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT patients_name_length CHECK (length(trim(name)) >= 2),
    CONSTRAINT patients_age_range CHECK (age >= 0 AND age <= 150),
    CONSTRAINT patients_sex_valid CHECK (sex IN ('Male', 'Female', 'Other', 'M', 'F')),
    CONSTRAINT patients_labno_format CHECK (length(trim(labno)) >= 3),
    CONSTRAINT patients_dateoftesting_valid CHECK (dateoftesting <= CURRENT_DATE),
    CONSTRAINT patients_diagnosis_length CHECK (length(trim(provisionaldiagnosis)) >= 3),
    CONSTRAINT patients_physician_length CHECK (length(trim(referringphysician)) >= 2),
    CONSTRAINT patients_contactinfo_valid CHECK (jsonb_typeof(contactinfo) = 'object'),
    CONSTRAINT patients_medical_history_valid CHECK (jsonb_typeof(medical_history) = 'object'),
    CONSTRAINT patients_allergies_valid CHECK (jsonb_typeof(allergies) = 'array'),
    CONSTRAINT patients_medications_valid CHECK (jsonb_typeof(medications) = 'array')
);

-- Test sessions with enhanced tracking
CREATE TABLE IF NOT EXISTS public.test_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    test_type VARCHAR(100) NOT NULL,
    allergen VARCHAR(255) NOT NULL,
    wheal_size_mm DECIMAL(4,2),
    test_result VARCHAR(50),
    notes TEXT,
    technician_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT test_sessions_test_name_length CHECK (length(trim(test_name)) >= 2),
    CONSTRAINT test_sessions_test_date_valid CHECK (test_date <= CURRENT_DATE + INTERVAL '1 day'),
    CONSTRAINT test_sessions_test_type_length CHECK (length(trim(test_type)) >= 2),
    CONSTRAINT test_sessions_allergen_length CHECK (length(trim(allergen)) >= 2),
    CONSTRAINT test_sessions_wheal_size_range CHECK (wheal_size_mm IS NULL OR (wheal_size_mm >= 0 AND wheal_size_mm <= 50)),
    CONSTRAINT test_sessions_result_valid CHECK (test_result IS NULL OR test_result IN ('Positive', 'Negative', 'Inconclusive', 'Not Tested'))
);

-- Allergen categories for standardization
CREATE TABLE IF NOT EXISTS public.allergen_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT allergen_categories_name_length CHECK (length(trim(name)) >= 2),
    CONSTRAINT allergen_categories_display_order_positive CHECK (display_order >= 0)
);

-- Standardized allergens
CREATE TABLE IF NOT EXISTS public.allergens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sno INTEGER NOT NULL UNIQUE,
    category_id UUID NOT NULL REFERENCES public.allergen_categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    common_names TEXT[],
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT allergens_sno_positive CHECK (sno > 0),
    CONSTRAINT allergens_name_length CHECK (length(trim(name)) >= 2)
);

-- Enhanced allergy tests
CREATE TABLE IF NOT EXISTS public.enhanced_allergy_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    patient_info JSONB NOT NULL,
    allergen_results JSONB NOT NULL DEFAULT '{}',
    controls JSONB NOT NULL DEFAULT '{}',
    interpretation TEXT,
    recommendations TEXT,
    technician_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    is_reviewed BOOLEAN NOT NULL DEFAULT false,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT enhanced_tests_test_date_valid CHECK (test_date <= CURRENT_DATE + INTERVAL '1 day'),
    CONSTRAINT enhanced_tests_patient_info_valid CHECK (jsonb_typeof(patient_info) = 'object'),
    CONSTRAINT enhanced_tests_allergen_results_valid CHECK (jsonb_typeof(allergen_results) = 'object'),
    CONSTRAINT enhanced_tests_controls_valid CHECK (jsonb_typeof(controls) = 'object'),
    CONSTRAINT enhanced_tests_reviewed_consistency CHECK (
        (is_reviewed = false AND reviewed_at IS NULL AND reviewed_by IS NULL) OR
        (is_reviewed = true AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
    )
);

-- Bookings/Appointments with comprehensive tracking
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    test_type VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    assigned_technician UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    assigned_doctor UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT bookings_appointment_date_future CHECK (appointment_date >= CURRENT_DATE - INTERVAL '1 day'),
    CONSTRAINT bookings_test_type_length CHECK (length(trim(test_type)) >= 2),
    CONSTRAINT bookings_status_valid CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    CONSTRAINT bookings_duration_range CHECK (duration_minutes > 0 AND duration_minutes <= 480),
    CONSTRAINT bookings_unique_appointment UNIQUE (appointment_date, appointment_time, assigned_technician)
);

-- Activity logs for audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT activity_logs_action_length CHECK (length(trim(action)) >= 2),
    CONSTRAINT activity_logs_resource_type_length CHECK (length(trim(resource_type)) >= 2),
    CONSTRAINT activity_logs_details_valid CHECK (jsonb_typeof(details) = 'object')
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_labno ON public.patients(labno);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_active ON public.patients(is_active);
CREATE INDEX IF NOT EXISTS idx_patients_dateoftesting ON public.patients(dateoftesting);

-- Test sessions indexes
CREATE INDEX IF NOT EXISTS idx_test_sessions_patient_id ON public.test_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_test_date ON public.test_sessions(test_date);
CREATE INDEX IF NOT EXISTS idx_test_sessions_technician_id ON public.test_sessions(technician_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_doctor_id ON public.test_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_completed ON public.test_sessions(is_completed);

-- Enhanced allergy tests indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_tests_patient_id ON public.enhanced_allergy_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_tests_test_date ON public.enhanced_allergy_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_tests_technician_id ON public.enhanced_allergy_tests(technician_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_tests_doctor_id ON public.enhanced_allergy_tests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_tests_completed ON public.enhanced_allergy_tests(is_completed);
CREATE INDEX IF NOT EXISTS idx_enhanced_tests_reviewed ON public.enhanced_allergy_tests(is_reviewed);

-- Allergens indexes
CREATE INDEX IF NOT EXISTS idx_allergens_sno ON public.allergens(sno);
CREATE INDEX IF NOT EXISTS idx_allergens_category_id ON public.allergens(category_id);
CREATE INDEX IF NOT EXISTS idx_allergens_active ON public.allergens(is_active);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_patient_id ON public.bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON public.bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_technician ON public.bookings(assigned_technician);
CREATE INDEX IF NOT EXISTS idx_bookings_doctor ON public.bookings(assigned_doctor);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON public.activity_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_sessions_updated_at BEFORE UPDATE ON public.test_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enhanced_allergy_tests_updated_at BEFORE UPDATE ON public.enhanced_allergy_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default roles
INSERT INTO public.roles (name, display_name, description, permissions) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', '{
  "patients": ["create", "read", "update", "delete"],
  "tests": ["create", "read", "update", "delete"],
  "bookings": ["create", "read", "update", "delete"],
  "users": ["create", "read", "update", "delete"],
  "roles": ["create", "read", "update", "delete"],
  "analytics": ["read"],
  "system": ["configure", "backup", "restore"]
}'),
('admin', 'Administrator', 'Administrative access to manage users and system settings', '{
  "patients": ["create", "read", "update"],
  "tests": ["create", "read", "update"],
  "bookings": ["create", "read", "update", "delete"],
  "users": ["create", "read", "update"],
  "analytics": ["read"]
}'),
('doctor', 'Doctor', 'Medical professional with patient care and test interpretation access', '{
  "patients": ["create", "read", "update"],
  "tests": ["create", "read", "update"],
  "bookings": ["create", "read", "update"],
  "analytics": ["read"]
}'),
('technician', 'Technician', 'Laboratory technician with test administration access', '{
  "patients": ["read"],
  "tests": ["create", "read", "update"],
  "bookings": ["read", "update"]
}'),
('receptionist', 'Receptionist', 'Front desk staff with patient registration and appointment scheduling', '{
  "patients": ["create", "read", "update"],
  "bookings": ["create", "read", "update"]
}')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = TIMEZONE('utc'::text, NOW());

-- Insert allergen categories
INSERT INTO public.allergen_categories (name, description, display_order) VALUES
('MITE', 'House dust mites and related allergens', 1),
('POLLENS', 'Tree, grass, and weed pollens', 2),
('TREES', 'Tree pollens and wood allergens', 3),
('FUNGI', 'Mold and fungal allergens', 4),
('DUST MIX', 'Various dust allergens', 5),
('EPITHELIA', 'Animal dander and epithelial allergens', 6),
('INSECTS', 'Insect allergens and venoms', 7)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SECURITY POLICIES (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_allergy_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergen_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Basic authenticated user policies (to be refined later)
CREATE POLICY "Allow authenticated users to read roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read user profiles" ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read test sessions" ON public.test_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read enhanced tests" ON public.enhanced_allergy_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read allergen categories" ON public.allergen_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read allergens" ON public.allergens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read bookings" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);

-- Insert/Update/Delete policies (more restrictive - will be enhanced with proper RBAC)
CREATE POLICY "Allow authenticated users to insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update patients" ON public.patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert test sessions" ON public.test_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update test sessions" ON public.test_sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert enhanced tests" ON public.enhanced_allergy_tests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update enhanced tests" ON public.enhanced_allergy_tests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update bookings" ON public.bookings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create super admin
CREATE OR REPLACE FUNCTION make_super_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    target_user_id UUID;
    super_admin_role_id UUID;
    existing_profile_id UUID;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RETURN 'Error: User with email ' || user_email || ' not found';
    END IF;
    
    -- Get super admin role ID
    SELECT id INTO super_admin_role_id 
    FROM public.roles 
    WHERE name = 'super_admin';
    
    IF super_admin_role_id IS NULL THEN
        RETURN 'Error: Super admin role not found';
    END IF;
    
    -- Check if profile already exists
    SELECT id INTO existing_profile_id
    FROM public.user_profiles
    WHERE user_id = target_user_id;
    
    IF existing_profile_id IS NULL THEN
        -- Create new profile
        INSERT INTO public.user_profiles (
            user_id, 
            role_id, 
            first_name, 
            last_name, 
            email
        ) VALUES (
            target_user_id,
            super_admin_role_id,
            'Super',
            'Admin',
            user_email
        );
        
        RETURN 'Success: Created super admin profile for ' || user_email;
    ELSE
        -- Update existing profile
        UPDATE public.user_profiles 
        SET role_id = super_admin_role_id,
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE user_id = target_user_id;
        
        RETURN 'Success: Updated ' || user_email || ' to super admin';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;