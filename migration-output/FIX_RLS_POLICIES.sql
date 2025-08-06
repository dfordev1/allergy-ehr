
-- ============================================================================
-- FIX RLS POLICIES FOR SKIN TRACK AID
-- Purpose: Enable data insertion by fixing restrictive RLS policies
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated users to read user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users to read test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to read enhanced tests" ON public.enhanced_allergy_tests;
DROP POLICY IF EXISTS "Allow authenticated users to read allergen categories" ON public.allergen_categories;
DROP POLICY IF EXISTS "Allow authenticated users to read allergens" ON public.allergens;
DROP POLICY IF EXISTS "Allow authenticated users to read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated users to read activity logs" ON public.activity_logs;

DROP POLICY IF EXISTS "Allow authenticated users to insert patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users to update patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users to insert test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to update test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to insert enhanced tests" ON public.enhanced_allergy_tests;
DROP POLICY IF EXISTS "Allow authenticated users to update enhanced tests" ON public.enhanced_allergy_tests;
DROP POLICY IF EXISTS "Allow authenticated users to insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated users to update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated users to insert activity logs" ON public.activity_logs;

-- Create more permissive policies for development
CREATE POLICY "Enable read access for all users" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.roles FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.roles FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.user_profiles FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.user_profiles FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.patients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.patients FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.test_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.test_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.test_sessions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.test_sessions FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.enhanced_allergy_tests FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.enhanced_allergy_tests FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.enhanced_allergy_tests FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.enhanced_allergy_tests FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.allergen_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.allergen_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.allergen_categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.allergen_categories FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.allergens FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.allergens FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.allergens FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.allergens FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.bookings FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.bookings FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.activity_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.activity_logs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.activity_logs FOR DELETE USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
