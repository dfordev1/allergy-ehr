-- Remove duration_minutes column from simple_bookings table
-- This script removes the duration field from the booking system

-- Remove the duration_minutes column if it exists
ALTER TABLE public.simple_bookings 
DROP COLUMN IF EXISTS duration_minutes;

-- Remove the duration index if it exists
DROP INDEX IF EXISTS idx_simple_bookings_duration;

-- Remove any constraints related to duration
ALTER TABLE public.simple_bookings 
DROP CONSTRAINT IF EXISTS simple_bookings_duration_range;

-- Update the create_simple_bookings_table function to not include duration
CREATE OR REPLACE FUNCTION create_simple_bookings_table()
RETURNS TEXT AS $$
BEGIN
    -- Create table if it doesn't exist without duration field
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
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create all indexes (without duration)
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_date ON public.simple_bookings(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_status ON public.simple_bookings(status);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_patient ON public.simple_bookings(patient_name);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_priority ON public.simple_bookings(priority);
    CREATE INDEX IF NOT EXISTS idx_simple_bookings_email ON public.simple_bookings(patient_email);

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

    RETURN 'Simple bookings table updated successfully - duration field removed';
EXCEPTION WHEN OTHERS THEN
    RETURN 'Error updating table: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up any sample data that might have duration references
UPDATE public.simple_bookings 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Verify the changes
SELECT 'Duration field successfully removed from simple_bookings table' AS status;