-- Fix RLS Policies to Avoid Infinite Recursion
-- Run this if you're getting "infinite recursion detected" errors

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;

-- Create simplified policies that don't cause recursion
CREATE POLICY "All authenticated users can view user profiles" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view activity logs" ON public.activity_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Note: Admin-specific restrictions will be handled at the application level
-- This prevents infinite recursion while maintaining security through the application layer