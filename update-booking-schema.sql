-- Update the simple_bookings table to include new enhanced fields
-- Add new columns for improved booking system

-- Add new columns if they don't exist
ALTER TABLE public.simple_bookings 
ADD COLUMN IF NOT EXISTS patient_email TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_simple_bookings_priority ON public.simple_bookings(priority);
CREATE INDEX IF NOT EXISTS idx_simple_bookings_email ON public.simple_bookings(patient_email);
CREATE INDEX IF NOT EXISTS idx_simple_bookings_duration ON public.simple_bookings(duration_minutes);

-- Update existing records to have default values for new fields
UPDATE public.simple_bookings 
SET 
  priority = 'normal',
  duration_minutes = 60,
  updated_at = NOW()
WHERE priority IS NULL OR duration_minutes IS NULL OR updated_at IS NULL;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_simple_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_simple_bookings_updated_at_trigger ON public.simple_bookings;
CREATE TRIGGER update_simple_bookings_updated_at_trigger
    BEFORE UPDATE ON public.simple_bookings
    FOR EACH ROW EXECUTE FUNCTION update_simple_bookings_updated_at();

-- Update the RPC function to handle new fields
CREATE OR REPLACE FUNCTION create_simple_bookings_table()
RETURNS TEXT AS $$
BEGIN
    -- Create table if it doesn't exist with all new fields
    CREATE TABLE IF NOT EXISTS public.simple_bookings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        patient_name TEXT NOT NULL,
        patient_phone TEXT,
        patient_email TEXT,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        test_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        duration_minutes INTEGER DEFAULT 60,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create all indexes
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_date ON public.simple_bookings(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_status ON public.simple_bookings(status);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_patient ON public.simple_bookings(patient_name);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_priority ON public.simple_bookings(priority);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_email ON public.simple_bookings(patient_email);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_duration ON public.simple_bookings(duration_minutes);

    -- Enable RLS
    ALTER TABLE public.simple_bookings ENABLE ROW LEVEL SECURITY;

    -- Drop and recreate policy
    DROP POLICY IF EXISTS "Allow all operations on simple_bookings" ON public.simple_bookings;
    CREATE POLICY "Allow all operations on simple_bookings" ON public.simple_bookings
        FOR ALL USING (true) WITH CHECK (true);

    -- Create updated_at trigger
    CREATE OR REPLACE FUNCTION update_simple_bookings_updated_at()
    RETURNS TRIGGER AS $inner$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $inner$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS update_simple_bookings_updated_at_trigger ON public.simple_bookings;
    CREATE TRIGGER update_simple_bookings_updated_at_trigger
        BEFORE UPDATE ON public.simple_bookings
        FOR EACH ROW EXECUTE FUNCTION update_simple_bookings_updated_at();

    RETURN 'Enhanced simple bookings table created successfully with new fields';
EXCEPTION WHEN OTHERS THEN
    RETURN 'Error creating enhanced table: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert enhanced sample data
INSERT INTO public.simple_bookings (patient_name, patient_phone, patient_email, appointment_date, appointment_time, test_type, priority, duration_minutes, notes) 
SELECT 'Alice Johnson', '555-0123', 'alice.johnson@email.com', CURRENT_DATE + INTERVAL '1 day', '09:30', 'Comprehensive Panel', 'high', 120, 'New patient - comprehensive allergy assessment needed'
WHERE NOT EXISTS (SELECT 1 FROM public.simple_bookings WHERE patient_name = 'Alice Johnson');

INSERT INTO public.simple_bookings (patient_name, patient_phone, patient_email, appointment_date, appointment_time, test_type, priority, duration_minutes, notes) 
SELECT 'Michael Chen', '555-0456', 'michael.chen@email.com', CURRENT_DATE + INTERVAL '2 days', '14:15', 'Food Allergy Test', 'urgent', 90, 'Recent severe reaction - priority testing required'
WHERE NOT EXISTS (SELECT 1 FROM public.simple_bookings WHERE patient_name = 'Michael Chen');

INSERT INTO public.simple_bookings (patient_name, patient_phone, patient_email, appointment_date, appointment_time, test_type, priority, duration_minutes, notes) 
SELECT 'Sarah Williams', '555-0789', 'sarah.williams@email.com', CURRENT_DATE + INTERVAL '3 days', '11:00', 'Environmental Allergy Test', 'normal', 45, 'Seasonal allergy follow-up'
WHERE NOT EXISTS (SELECT 1 FROM public.simple_bookings WHERE patient_name = 'Sarah Williams');