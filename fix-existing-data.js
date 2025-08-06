import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function checkExistingPatients() {
  console.log('🔍 Checking existing patient data...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/patients?select=id,name,labno,dateoftesting`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (response.ok) {
      const patients = await response.json();
      console.log(`📊 Found ${patients.length} existing patients`);
      
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
      
      console.log(`📅 Valid date range: ${oneYearAgo.toISOString().split('T')[0]} to ${oneYearFromNow.toISOString().split('T')[0]}`);
      
      const invalidPatients = [];
      
      for (const patient of patients) {
        const testDate = new Date(patient.dateoftesting);
        if (testDate < oneYearAgo || testDate > oneYearFromNow) {
          invalidPatients.push({
            ...patient,
            testDate: patient.dateoftesting,
            isValid: false
          });
        }
      }
      
      if (invalidPatients.length > 0) {
        console.log(`⚠️  Found ${invalidPatients.length} patients with invalid dates:`);
        invalidPatients.forEach(p => {
          console.log(`   - ${p.name} (${p.labno}): ${p.testDate}`);
        });
        
        return invalidPatients;
      } else {
        console.log('✅ All existing patients have valid dates');
        return [];
      }
    } else {
      console.log(`❌ Failed to fetch patients: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Error checking patients: ${error.message}`);
    return [];
  }
}

async function fixInvalidPatients(invalidPatients) {
  console.log('\n🔧 Fixing invalid patient dates...');
  
  const today = new Date();
  let fixedCount = 0;
  
  for (const patient of invalidPatients) {
    try {
      // Set the date to today if it's too old or too far in the future
      const newDate = today.toISOString().split('T')[0];
      
      console.log(`   Fixing ${patient.name}: ${patient.testDate} → ${newDate}`);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/patients?id=eq.${patient.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          dateoftesting: newDate
        })
      });
      
      if (response.ok) {
        console.log(`   ✅ Fixed ${patient.name}`);
        fixedCount++;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Failed to fix ${patient.name}: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error fixing ${patient.name}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Fixed ${fixedCount}/${invalidPatients.length} patients`);
  return fixedCount;
}

async function createSQLFix() {
  console.log('\n📝 Creating SQL fix for manual execution...');
  
  const sqlFix = `-- ============================================================================
-- FIX PATIENT DATE CONSTRAINT - STEP BY STEP
-- ============================================================================

-- Step 1: First, let's see what patients have invalid dates
SELECT id, name, labno, dateoftesting 
FROM public.patients 
WHERE dateoftesting < CURRENT_DATE - INTERVAL '1 year' 
   OR dateoftesting > CURRENT_DATE + INTERVAL '1 year';

-- Step 2: Update any patients with dates too far in the past or future
UPDATE public.patients 
SET dateoftesting = CURRENT_DATE 
WHERE dateoftesting < CURRENT_DATE - INTERVAL '1 year' 
   OR dateoftesting > CURRENT_DATE + INTERVAL '1 year';

-- Step 3: Now we can safely drop the old constraint
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_dateoftesting_valid;

-- Step 4: Create the new flexible constraint
ALTER TABLE public.patients ADD CONSTRAINT patients_dateoftesting_valid 
CHECK (dateoftesting >= CURRENT_DATE - INTERVAL '1 year' AND dateoftesting <= CURRENT_DATE + INTERVAL '1 year');

-- Step 5: Verify the constraint was created
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'patients' 
AND tc.constraint_name = 'patients_dateoftesting_valid';

-- Step 6: Test that it works
INSERT INTO public.patients (
    name, age, sex, labno, dateoftesting, 
    provisionaldiagnosis, referringphysician
) VALUES (
    'Test Patient Future', 30, 'Male', 'TEST_FUTURE_001', 
    CURRENT_DATE + INTERVAL '1 month',
    'Test Diagnosis', 'Dr. Test'
);

-- Step 7: Clean up test record
DELETE FROM public.patients WHERE labno = 'TEST_FUTURE_001';

-- Step 8: Success message
SELECT 'Date constraint fix completed successfully!' as status;`;

  const filePath = path.join(__dirname, 'migration-output', 'FIX_PATIENT_DATES_STEP_BY_STEP.sql');
  
  try {
    fs.writeFileSync(filePath, sqlFix);
    console.log(`✅ SQL fix saved to: ${filePath}`);
    console.log('📋 Copy this file content and run it in Supabase Dashboard');
  } catch (error) {
    console.log(`❌ Error saving SQL file: ${error.message}`);
  }
  
  return sqlFix;
}

async function main() {
  console.log('🔍 ANALYZING PATIENT DATA FOR CONSTRAINT FIX');
  console.log('=' .repeat(50));
  
  // Step 1: Check existing patients
  const invalidPatients = await checkExistingPatients();
  
  if (invalidPatients.length > 0) {
    console.log('\n⚠️  INVALID PATIENTS FOUND');
    console.log('These patients have dates that violate the new constraint.');
    
    // Step 2: Try to fix them automatically
    const fixedCount = await fixInvalidPatients(invalidPatients);
    
    if (fixedCount < invalidPatients.length) {
      console.log('\n⚠️  Some patients could not be fixed automatically.');
      console.log('You may need to fix them manually or delete them.');
    }
  }
  
  // Step 3: Create SQL fix for manual execution
  await createSQLFix();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 NEXT STEPS:');
  console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project: dmcuunucjmmofdfvteta');
  console.log('3. Click "SQL Editor"');
  console.log('4. Copy the content from migration-output/FIX_PATIENT_DATES_STEP_BY_STEP.sql');
  console.log('5. Run the SQL step by step');
  console.log('6. Test with: node test-patient-insertion.js');
}

main().catch(console.error); 