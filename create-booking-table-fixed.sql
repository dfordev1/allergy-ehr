-- Create a simple bookings table that works without authentication issues
-- Fixed version without IF NOT EXISTS for policies

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations on simple_bookings" ON public.simple_bookings;

-- Create the table
CREATE TABLE IF NOT EXISTS public.simple_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    test_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simple_bookings_date ON public.simple_bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_simple_bookings_status ON public.simple_bookings(status);
CREATE INDEX IF NOT EXISTS idx_simple_bookings_patient ON public.simple_bookings(patient_name);

-- Enable RLS
ALTER TABLE public.simple_bookings ENABLE ROW LEVEL SECURITY;

-- Create permissive policy (without IF NOT EXISTS)
CREATE POLICY "Allow all operations on simple_bookings" ON public.simple_bookings
    FOR ALL USING (true) WITH CHECK (true);

-- Function to create the table via RPC (if needed)
CREATE OR REPLACE FUNCTION create_simple_bookings_table()
RETURNS TEXT AS $$
BEGIN
    -- Drop existing policy first
    BEGIN
        DROP POLICY IF EXISTS "Allow all operations on simple_bookings" ON public.simple_bookings;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if policy doesn't exist
        NULL;
    END;

    -- Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.simple_bookings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        patient_name TEXT NOT NULL,
        patient_phone TEXT,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        test_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_date ON public.simple_bookings(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_status ON public.simple_bookings(status);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_patient ON public.simple_bookings(patient_name);

    -- Enable RLS
    ALTER TABLE public.simple_bookings ENABLE ROW LEVEL SECURITY;

    -- Create permissive policy
    CREATE POLICY "Allow all operations on simple_bookings" ON public.simple_bookings
        FOR ALL USING (true) WITH CHECK (true);

    RETURN 'Simple bookings table created successfully';
EXCEPTION WHEN OTHERS THEN
    RETURN 'Error creating table: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data for testing (only if table is empty)
INSERT INTO public.simple_bookings (patient_name, patient_phone, appointment_date, appointment_time, test_type, notes) 
SELECT 'John Doe', '123-456-7890', CURRENT_DATE + INTERVAL '1 day', '09:00', 'Skin Prick Test', 'First time patient'
WHERE NOT EXISTS (SELECT 1 FROM public.simple_bookings WHERE patient_name = 'John Doe');

INSERT INTO public.simple_bookings (patient_name, patient_phone, appointment_date, appointment_time, test_type, notes) 
SELECT 'Jane Smith', '098-765-4321', CURRENT_DATE + INTERVAL '2 days', '10:30', 'Food Allergy Test', 'Follow-up appointment'
WHERE NOT EXISTS (SELECT 1 FROM public.simple_bookings WHERE patient_name = 'Jane Smith');

INSERT INTO public.simple_bookings (patient_name, patient_phone, appointment_date, appointment_time, test_type, notes) 
SELECT 'Bob Johnson', '555-123-4567', CURRENT_DATE + INTERVAL '3 days', '14:00', 'Environmental Allergy Test', 'Seasonal allergies'
WHERE NOT EXISTS (SELECT 1 FROM public.simple_bookings WHERE patient_name = 'Bob Johnson');