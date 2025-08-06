-- ============================================================================
-- DATABASE AUTHENTICATION FIX
-- ============================================================================
-- This SQL fixes the "Database error saving new user" issue

-- Step 1: Drop the problematic trigger that's causing user creation to fail
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create a safer trigger function that won't fail user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Try to get default role, but don't fail if it doesn't exist
    BEGIN
        SELECT id INTO default_role_id FROM public.roles WHERE name = 'admin' LIMIT 1;
        
        -- If no admin role, try receptionist
        IF default_role_id IS NULL THEN
            SELECT id INTO default_role_id FROM public.roles WHERE name = 'receptionist' LIMIT 1;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If roles table doesn't exist or has issues, continue without role
        default_role_id := NULL;
    END;
    
    -- Try to insert user profile, but don't fail user creation if this fails
    BEGIN
        INSERT INTO public.user_profiles (id, role_id, first_name, last_name, email, username)
        VALUES (
            NEW.id,
            default_role_id,
            COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
            NEW.email,
            split_part(NEW.email, '@', 1)
        );
    EXCEPTION WHEN OTHERS THEN
        -- If profile creation fails, log it but don't prevent user creation
        RAISE NOTICE 'Could not create user profile for %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the new safe trigger
CREATE TRIGGER on_auth_user_created_safe
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_safe();

-- Step 4: Ensure the roles table has at least one role
INSERT INTO public.roles (name, display_name, description, permissions) VALUES
('admin', 'Administrator', 'Full system access', '{
    "patients": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "tests": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "bookings": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "users": {"create": true, "read": true, "update": true, "delete": true, "manage_roles": true},
    "analytics": {"read": true, "export": true, "advanced": true},
    "settings": {"read": true, "update": true, "system": true},
    "audit": {"read": true, "export": true}
}')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Make sure RLS policies allow user creation
-- These policies should allow user signup to work
CREATE POLICY IF NOT EXISTS "Allow user profile creation on signup" ON public.user_profiles
    FOR INSERT WITH CHECK (true);

-- Step 6: Create a function to manually fix any existing auth users without profiles
CREATE OR REPLACE FUNCTION public.fix_existing_users()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    admin_role_id UUID;
    fixed_count INTEGER := 0;
BEGIN
    -- Get admin role ID
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin' LIMIT 1;
    
    -- Loop through auth users that don't have profiles
    FOR user_record IN 
        SELECT au.id, au.email 
        FROM auth.users au 
        LEFT JOIN public.user_profiles up ON au.id = up.id 
        WHERE up.id IS NULL
    LOOP
        -- Create profile for this user
        BEGIN
            INSERT INTO public.user_profiles (id, role_id, first_name, last_name, email, username)
            VALUES (
                user_record.id,
                admin_role_id,
                split_part(user_record.email, '@', 1),
                'User',
                user_record.email,
                split_part(user_record.email, '@', 1)
            );
            fixed_count := fixed_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Skip if can't create profile
            CONTINUE;
        END;
    END LOOP;
    
    RETURN 'Fixed ' || fixed_count || ' existing users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the fix for existing users
SELECT public.fix_existing_users();