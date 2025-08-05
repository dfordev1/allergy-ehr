# Supabase Setup for Complete RBAC System

## Problem
Your application now includes a comprehensive Role-Based Access Control (RBAC) system with user management, but the required database tables need to be created.

## Solution
You need to create the complete database schema including roles, user profiles, activity logs, and enhanced allergy test system.

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `dmcuunucjmmofdfvteta`
3. Go to **SQL Editor** in the left sidebar
4. **IMPORTANT**: Run the migrations in the correct order:

### Step 1: Create User Roles System
Click **New Query** and copy and paste the SQL from: `supabase/migrations/create_user_roles_system.sql`

### Step 2: Create Bookings Table  
Click **New Query** and copy and paste the SQL from: `supabase/migrations/create_bookings_table.sql`

### Step 3: Create Enhanced Allergy Test System
Click **New Query** and copy and paste the SQL from: `supabase/migrations/enhanced_allergy_tests.sql`

### Step 4: Insert Allergens Data
Click **New Query** and copy and paste the SQL from: `supabase/migrations/insert_allergens.sql`

### Step 5: Fix RLS Policies (If Getting Recursion Errors)
If you get "infinite recursion detected" errors, run this fix:
Click **New Query** and copy and paste the SQL from: `supabase/migrations/fix_rls_policies.sql`

### Step 6: Create Super Admin (IMPORTANT!)
Click **New Query** and copy and paste the SQL from: `supabase/migrations/create_super_admin.sql`

**Then run this command with YOUR email:**
```sql
SELECT make_super_admin('maajidsb1@gmail.com');
```

## What This Creates

### 🔐 **Role-Based Access Control System**

#### **4 Default Roles:**
- **Administrator** - Full system access
- **Doctor** - Medical professional access  
- **Technician** - Lab and test management
- **Receptionist** - Basic patient and booking access

#### **New Tables:**
- `roles` - System roles with permissions
- `user_profiles` - Extended user information
- `activity_logs` - Audit trail for all actions

#### **Permissions System:**
Each role has specific permissions for:
- **Patients**: create, read, update, delete, export
- **Tests**: create, read, update, delete, export  
- **Bookings**: create, read, update, delete, export
- **Users**: create, read, update, delete, manage_roles
- **Analytics**: read, export, advanced
- **Settings**: read, update, system
- **Audit**: read, export

### 📅 **Enhanced Booking System**

```sql
-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    test_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_patient_id ON public.bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all bookings
CREATE POLICY "Users can view all bookings" ON public.bookings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert bookings
CREATE POLICY "Users can insert bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update bookings
CREATE POLICY "Users can update bookings" ON public.bookings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete bookings
CREATE POLICY "Users can delete bookings" ON public.bookings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

6. Click **Run** to execute the SQL
7. You should see a success message

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

1. Run the migration file:
```bash
supabase db push
```

## What This Does

1. **Creates the `bookings` table** with all necessary columns
2. **Sets up foreign key relationship** to the `patients` table
3. **Adds indexes** for better query performance
4. **Enables Row Level Security (RLS)** for data protection
5. **Creates policies** to allow authenticated users to manage bookings
6. **Sets up automatic timestamp updates** for the `updated_at` field

## After Running the SQL

Once you've created the table:

1. **Restart your development server** if it's running
2. **Test the booking functionality**:
   - Go to the Bookings page
   - Try creating a new booking
   - Check that it appears in the list
   - Verify it's saved in Supabase

## Verification

To verify the table was created correctly:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see a new `bookings` table
3. The table should have all the columns: `id`, `patient_id`, `patient_name`, `booking_date`, `booking_time`, `test_type`, `status`, `notes`, `created_at`, `updated_at`

## Troubleshooting

If you encounter any errors:

1. **Check the SQL syntax** - Make sure you copied the entire SQL block
2. **Verify permissions** - Make sure you're logged into the correct Supabase project
3. **Check for existing table** - If the table already exists, you might need to drop it first or modify the SQL
4. **Review error messages** - Supabase will show specific error messages if something goes wrong

## Code Changes Made

I've also updated your code to:

1. **Actually save bookings** to Supabase in `AddBookingForm.tsx`
2. **Fetch real booking data** from Supabase in `BookingPage.tsx`
3. **Added TypeScript types** for the bookings table
4. **Improved error handling** with better error messages

The booking functionality should now work properly once you create the table in Supabase! 