-- User Roles and Permissions System
-- This migration creates a comprehensive role-based access control system

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    phone TEXT,
    department TEXT,
    license_number TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    profile_image_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON public.activity_logs(resource_type);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "All authenticated users can view roles" ON public.roles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage roles" ON public.roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name = 'admin'
        )
    );

-- RLS Policies for user_profiles (Fixed to avoid infinite recursion)
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "All authenticated users can view user profiles" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Authenticated users can insert profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Note: We'll handle admin-specific permissions at the application level
-- to avoid infinite recursion in RLS policies

-- RLS Policies for activity_logs (Simplified to avoid recursion)
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can view activity logs" ON public.activity_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles with comprehensive permissions
INSERT INTO public.roles (name, display_name, description, permissions) VALUES
('admin', 'Administrator', 'Full system access with all permissions', '{
    "patients": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "tests": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "bookings": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "users": {"create": true, "read": true, "update": true, "delete": true, "manage_roles": true},
    "analytics": {"read": true, "export": true, "advanced": true},
    "settings": {"read": true, "update": true, "system": true},
    "audit": {"read": true, "export": true}
}'),
('doctor', 'Doctor', 'Medical professional with patient care permissions', '{
    "patients": {"create": true, "read": true, "update": true, "delete": false, "export": true},
    "tests": {"create": true, "read": true, "update": true, "delete": false, "export": true},
    "bookings": {"create": true, "read": true, "update": true, "delete": false, "export": false},
    "users": {"create": false, "read": true, "update": false, "delete": false, "manage_roles": false},
    "analytics": {"read": true, "export": true, "advanced": true},
    "settings": {"read": true, "update": false, "system": false},
    "audit": {"read": false, "export": false}
}'),
('technician', 'Technician', 'Laboratory technician with test management permissions', '{
    "patients": {"create": false, "read": true, "update": true, "delete": false, "export": false},
    "tests": {"create": true, "read": true, "update": true, "delete": false, "export": false},
    "bookings": {"create": false, "read": true, "update": true, "delete": false, "export": false},
    "users": {"create": false, "read": false, "update": false, "delete": false, "manage_roles": false},
    "analytics": {"read": true, "export": false, "advanced": false},
    "settings": {"read": true, "update": false, "system": false},
    "audit": {"read": false, "export": false}
}'),
('receptionist', 'Receptionist', 'Front desk staff with booking and basic patient permissions', '{
    "patients": {"create": true, "read": true, "update": true, "delete": false, "export": false},
    "tests": {"create": false, "read": true, "update": false, "delete": false, "export": false},
    "bookings": {"create": true, "read": true, "update": true, "delete": false, "export": false},
    "users": {"create": false, "read": false, "update": false, "delete": false, "manage_roles": false},
    "analytics": {"read": true, "export": false, "advanced": false},
    "settings": {"read": true, "update": false, "system": false},
    "audit": {"read": false, "export": false}
}')
ON CONFLICT (name) DO NOTHING;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Get the default role (receptionist) for new users
    SELECT id INTO default_role_id FROM public.roles WHERE name = 'receptionist' LIMIT 1;
    
    INSERT INTO public.user_profiles (id, role_id, first_name, last_name, email, username)
    VALUES (
        NEW.id,
        default_role_id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        split_part(NEW.email, '@', 1)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_activity(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION public.check_permission(
    p_resource TEXT,
    p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT r.permissions INTO user_permissions
    FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid() AND up.is_active = true AND r.is_active = true;
    
    IF user_permissions IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN COALESCE((user_permissions->p_resource->>p_action)::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;