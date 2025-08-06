import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function executeSQL(sql) {
  try {
    // Try to execute SQL using Supabase's REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    });

    if (response.ok) {
      return { success: true, data: await response.json() };
    } else {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createRLSFixFile() {
  console.log('🔧 Creating RLS Policy Fix File...');
  
  const rlsFixSQL = `
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
`;

  const outputDir = path.join(__dirname, '..', 'migration-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const rlsFixFile = path.join(outputDir, 'FIX_RLS_POLICIES.sql');
  fs.writeFileSync(rlsFixFile, rlsFixSQL);
  console.log(`✅ Created RLS fix file: ${rlsFixFile}`);
  
  return rlsFixFile;
}

async function createCompleteSetupFile() {
  console.log('\n📋 Creating Complete Setup Instructions...');
  
  const completeSetup = `
# 🚀 Complete Skin Track Aid Database Setup

## Step 1: Fix RLS Policies (REQUIRED)
1. Go to: https://supabase.com/dashboard
2. Navigate to your project: **dmcuunucjmmofdfvteta**
3. Go to **SQL Editor** in the left sidebar
4. Copy and paste the content from: \`migration-output/FIX_RLS_POLICIES.sql\`
5. Click **Run**
6. Wait for the policies to be updated

## Step 2: Insert Default Data
After fixing RLS policies, run this command in your terminal:
\`\`\`bash
node scripts/insert-default-data.js
\`\`\`

## Step 3: Verify Setup
Run this command to verify everything is working:
\`\`\`bash
node scripts/verify-database.js
\`\`\`

## Alternative: Manual Setup
If the automated scripts don't work, manually run these SQL files in order:

1. **Fix RLS**: \`migration-output/FIX_RLS_POLICIES.sql\`
2. **Core Schema**: \`migration-output/step-1-00_create_core_schema.sql\`
3. **Cleanup**: \`migration-output/step-2-01_cleanup_and_recreate.sql\`
4. **Default Data**: \`migration-output/step-3-02_insert_default_data.sql\`
5. **Verify**: \`migration-output/step-4-03_verify_setup.sql\`

## Your App URLs
- **Local Development**: http://localhost:8080/
- **Supabase Project**: https://supabase.com/dashboard/project/dmcuunucjmmofdfvteta

## Troubleshooting
- If you get RLS errors, make sure you ran the FIX_RLS_POLICIES.sql first
- If tables are empty, run the insert-default-data.js script
- Check the Debug tab in your app for real-time database status
`;

  const outputDir = path.join(__dirname, '..', 'migration-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const setupFile = path.join(outputDir, 'COMPLETE_SETUP_GUIDE.md');
  fs.writeFileSync(setupFile, completeSetup);
  console.log(`✅ Created complete setup guide: ${setupFile}`);
}

async function main() {
  console.log('🔧 Creating RLS Policy Fix for Skin Track Aid');
  console.log('=' .repeat(60));
  
  await createRLSFixFile();
  await createCompleteSetupFile();
  
  console.log('\n🎉 RLS fix files created successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Navigate to your project: dmcuunucjmmofdfvteta');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste: migration-output/FIX_RLS_POLICIES.sql');
  console.log('5. Click Run');
  console.log('6. Then run: node scripts/insert-default-data.js');
  console.log('\n🔗 Your app is running at: http://localhost:8080/');
}

// Run the script
main().catch(console.error); 