-- ============================================================================
-- FIX BOOKINGS TABLE SCHEMA
-- Ensures consistent column naming: appointment_date, appointment_time
-- ============================================================================

-- Step 1: Drop the old bookings table if it exists with wrong schema
DROP TABLE IF EXISTS public.bookings CASCADE;

-- Step 2: Create the correct bookings table with appointment_date/appointment_time
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

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_patient_id ON public.bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON public.bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_technician ON public.bookings(assigned_technician);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_doctor ON public.bookings(assigned_doctor);

-- Step 4: Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Users can view all bookings" ON public.bookings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update bookings" ON public.bookings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete bookings" ON public.bookings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 6: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_bookings_updated_at_column();

-- Step 8: Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 9: Success message
SELECT 'Bookings table schema fixed successfully!' as status; 