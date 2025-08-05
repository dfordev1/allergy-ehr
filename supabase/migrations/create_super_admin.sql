-- Create Super Admin User
-- Run this AFTER creating the RBAC system to make your current user a super admin

-- First, let's create a special super admin role with all permissions
INSERT INTO public.roles (name, display_name, description, permissions) VALUES
('super_admin', 'Super Administrator', 'System super administrator with unrestricted access', '{
    "patients": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "tests": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "bookings": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "users": {"create": true, "read": true, "update": true, "delete": true, "manage_roles": true},
    "analytics": {"read": true, "export": true, "advanced": true},
    "settings": {"read": true, "update": true, "system": true},
    "audit": {"read": true, "export": true},
    "system": {"full_access": true, "manage_database": true, "manage_security": true}
}')
ON CONFLICT (name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Function to make a user super admin by email
CREATE OR REPLACE FUNCTION make_super_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    super_admin_role_id UUID;
    result_message TEXT;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN 'User with email ' || user_email || ' not found';
    END IF;
    
    -- Get the super admin role ID
    SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin';
    
    IF super_admin_role_id IS NULL THEN
        RETURN 'Super admin role not found. Please run the RBAC migration first.';
    END IF;
    
    -- Update or insert user profile with super admin role
    INSERT INTO public.user_profiles (
        id, 
        role_id, 
        first_name, 
        last_name, 
        email, 
        username,
        department,
        is_active
    )
    VALUES (
        user_id,
        super_admin_role_id,
        COALESCE((SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE id = user_id), split_part(user_email, '@', 1)),
        COALESCE((SELECT raw_user_meta_data->>'last_name' FROM auth.users WHERE id = user_id), 'Admin'),
        user_email,
        split_part(user_email, '@', 1),
        'Administration',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        role_id = super_admin_role_id,
        department = 'Administration',
        is_active = true,
        updated_at = NOW();
    
    -- Log the action (only if activity_logs table exists)
    BEGIN
        INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, details)
        VALUES (user_id, 'promote_to_super_admin', 'user', user_id::text, '{"promoted_by": "system", "role": "super_admin"}');
    EXCEPTION
        WHEN undefined_table THEN
            -- activity_logs table doesn't exist yet, skip logging
            NULL;
    END;
    
    RETURN 'Successfully made ' || user_email || ' a super administrator';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;