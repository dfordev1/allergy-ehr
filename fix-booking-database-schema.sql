-- Fix booking database schema to support all current features
-- This script will add the missing columns that the frontend expects

-- First, let's create the table with all necessary columns if it doesn't exist
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

-- Add missing columns to existing table if they don't exist
ALTER TABLE public.simple_bookings 
ADD COLUMN IF NOT EXISTS patient_email TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraints for priority if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'simple_bookings_priority_check' 
        AND table_name = 'simple_bookings'
    ) THEN
        ALTER TABLE public.simple_bookings 
        ADD CONSTRAINT simple_bookings_priority_check 
        CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simple_bookings_date ON public.simple_bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_simple_bookings_status ON public.simple_bookings(status);
CREATE INDEX IF NOT EXISTS idx_simple_bookings_patient ON public.simple_bookings(patient_name);
CREATE INDEX IF NOT EXISTS idx_simple_bookings_priority ON public.simple_bookings(priority);
CREATE INDEX IF NOT EXISTS idx_simple_bookings_email ON public.simple_bookings(patient_email);

-- Enable Row Level Security
ALTER TABLE public.simple_bookings ENABLE ROW LEVEL SECURITY;

-- Create or update the policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations on simple_bookings" ON public.simple_bookings;
CREATE POLICY "Allow all operations on simple_bookings" ON public.simple_bookings
    FOR ALL USING (true) WITH CHECK (true);

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

-- Update existing records to have default values for new fields
UPDATE public.simple_bookings 
SET 
  priority = COALESCE(priority, 'normal'),
  updated_at = COALESCE(updated_at, NOW())
WHERE priority IS NULL OR updated_at IS NULL;

-- Insert some sample data if the table is empty
INSERT INTO public.simple_bookings (patient_name, patient_phone, patient_email, appointment_date, appointment_time, test_type, priority, notes) 
SELECT 'John Doe', '123-456-7890', 'john.doe@example.com', CURRENT_DATE + INTERVAL '1 day', '09:00', 'Skin Prick Test', 'normal', 'First time patient'
WHERE NOT EXISTS (SELECT 1 FROM public.simple_bookings WHERE patient_name = 'John Doe');

INSERT INTO public.simple_bookings (patient_name, patient_phone, patient_email, appointment_date, appointment_time, test_type, priority, notes) 
SELECT 'Jane Smith', '098-765-4321', 'jane.smith@example.com', CURRENT_DATE + INTERVAL '2 days', '10:30', 'Food Allergy Test', 'high', 'Follow-up appointment'
WHERE NOT EXISTS (SELECT 1 FROM public.simple_bookings WHERE patient_name = 'Jane Smith');

INSERT INTO public.simple_bookings (patient_name, patient_phone, appointment_date, appointment_time, test_type, notes) 
SELECT 'Bob Johnson', '555-123-4567', CURRENT_DATE + INTERVAL '3 days', '14:00', 'Environmental Allergy Test', 'Seasonal allergies'
WHERE NOT EXISTS (SELECT 1 FROM public.simple_bookings WHERE patient_name = 'Bob Johnson');

-- Verify the table structure
SELECT 'Database schema updated successfully! All columns are now available.' AS status;

-- Show the current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'simple_bookings' 
AND table_schema = 'public'
ORDER BY ordinal_position;