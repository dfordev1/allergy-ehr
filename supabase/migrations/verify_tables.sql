-- ============================================================================
-- VERIFICATION SCRIPT - Check if all tables exist
-- ============================================================================

-- Check if core tables exist
SELECT 
    'patients' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'patients'
    ) as exists
UNION ALL
SELECT 
    'roles' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
    ) as exists
UNION ALL
SELECT 
    'user_profiles' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) as exists
UNION ALL
SELECT 
    'test_sessions' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'test_sessions'
    ) as exists
UNION ALL
SELECT 
    'enhanced_allergy_tests' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'enhanced_allergy_tests'
    ) as exists
UNION ALL
SELECT 
    'bookings' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings'
    ) as exists
UNION ALL
SELECT 
    'activity_logs' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
    ) as exists
UNION ALL
SELECT 
    'allergen_categories' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'allergen_categories'
    ) as exists
UNION ALL
SELECT 
    'allergens' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'allergens'
    ) as exists;

-- Check if default roles were created
SELECT 'Default Roles' as check_type, COUNT(*) as count FROM public.roles;

-- Check if allergens were inserted
SELECT 'Allergens' as check_type, COUNT(*) as count FROM public.allergens;

-- Check if super admin function exists
SELECT 
    'make_super_admin function' as function_name,
    EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'make_super_admin'
    ) as exists; 