import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

// SQL commands to fix the database
const SQL_FIXES = [
  // Fix 1: Drop the restrictive date constraint
  "ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_dateoftesting_valid;",
  
  // Fix 2: Create flexible date constraint
  `ALTER TABLE public.patients ADD CONSTRAINT patients_dateoftesting_valid 
   CHECK (dateoftesting >= CURRENT_DATE - INTERVAL '1 year' AND dateoftesting <= CURRENT_DATE + INTERVAL '1 year');`,
  
  // Fix 3: Drop test_sessions constraint
  "ALTER TABLE public.test_sessions DROP CONSTRAINT IF EXISTS test_sessions_test_date_valid;",
  
  // Fix 4: Create flexible test_sessions constraint
  `ALTER TABLE public.test_sessions ADD CONSTRAINT test_sessions_test_date_valid 
   CHECK (test_date >= CURRENT_DATE - INTERVAL '1 year' AND test_date <= CURRENT_DATE + INTERVAL '1 year');`,
  
  // Fix 5: Drop enhanced_allergy_tests constraint
  "ALTER TABLE public.enhanced_allergy_tests DROP CONSTRAINT IF EXISTS enhanced_tests_test_date_valid;",
  
  // Fix 6: Create flexible enhanced_allergy_tests constraint
  `ALTER TABLE public.enhanced_allergy_tests ADD CONSTRAINT enhanced_tests_test_date_valid 
   CHECK (test_date >= CURRENT_DATE - INTERVAL '1 year' AND test_date <= CURRENT_DATE + INTERVAL '1 year');`
];

async function executeSQL(sqlCommand) {
  try {
    console.log(`🔧 Executing: ${sqlCommand.substring(0, 50)}...`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        sql: sqlCommand
      })
    });
    
    if (response.ok) {
      console.log(`   ✅ Success`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runDatabaseFix() {
  console.log('🔧 RUNNING DATABASE FIX VIA REST API');
  console.log('=' .repeat(50));
  
  let successCount = 0;
  let totalFixes = SQL_FIXES.length;
  
  for (const sql of SQL_FIXES) {
    const success = await executeSQL(sql);
    if (success) successCount++;
    
    // Small delay between commands
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Results: ${successCount}/${totalFixes} SQL commands executed successfully`);
  
  if (successCount === totalFixes) {
    console.log('🎉 DATABASE FIX COMPLETED!');
    console.log('✅ Date constraints have been updated');
    console.log('✅ You can now add patients with future dates');
  } else {
    console.log('⚠️  Some fixes failed. You may need to run manually in Supabase Dashboard.');
  }
  
  // Test the fix
  console.log('\n🧪 Testing the fix...');
  await testPatientInsertion();
}

async function testPatientInsertion() {
  const timestamp = Date.now();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const testPatient = {
    name: `Test Patient Future ${timestamp}`,
    age: 30,
    sex: 'Male',
    labno: `TEST_FUTURE_${timestamp}`,
    dateoftesting: tomorrowStr,
    provisionaldiagnosis: 'Test Diagnosis Future',
    referringphysician: 'Dr. Test Future'
  };
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testPatient)
    });
    
    if (response.ok) {
      console.log('✅ SUCCESS: Future date patient insertion works!');
      console.log('🎉 Your database is now fully functional!');
      
      // Clean up
      await fetch(`${SUPABASE_URL}/rest/v1/patients?labno=eq.${testPatient.labno}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        }
      });
    } else {
      const errorText = await response.text();
      console.log(`❌ FAILED: ${response.status} - ${errorText}`);
      console.log('💡 You may need to run the fix manually in Supabase Dashboard');
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

// Alternative: Try using pg_sql function if available
async function tryAlternativeMethod() {
  console.log('\n🔄 Trying alternative method...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pg_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        query: "ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_dateoftesting_valid;"
      })
    });
    
    if (response.ok) {
      console.log('✅ Alternative method works! Using pg_sql function...');
      return true;
    } else {
      console.log('❌ Alternative method failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Alternative method error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Database Fix...');
  
  // Try the main method first
  await runDatabaseFix();
  
  // If that fails, try alternative
  if (false) { // Disabled for now
    await tryAlternativeMethod();
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. If the fix worked, test your application at http://localhost:8080/');
  console.log('2. If it failed, manually run the SQL in Supabase Dashboard');
  console.log('3. Copy the content from migration-output/COMPLETE_DATABASE_FIX.sql');
}

main().catch(console.error); 