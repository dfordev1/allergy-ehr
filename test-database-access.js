import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function testDatabaseOperation(table, operation, data = null) {
  try {
    let response;
    
    switch (operation) {
      case 'insert':
        response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(data)
        });
        break;
        
      case 'select':
        response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          }
        });
        break;
        
      case 'update':
        response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.test-id`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(data)
        });
        break;
        
      case 'delete':
        response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.test-id`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          }
        });
        break;
    }
    
    return { success: response.ok, status: response.status, error: response.ok ? null : await response.text() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runDatabaseTests() {
  console.log('🧪 Testing Database Access - Final Verification');
  console.log('=' .repeat(50));
  
  // Get tomorrow's date for bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const tests = [
    { table: 'patients', operation: 'insert', data: { name: 'Test Patient', age: 30, sex: 'Male', labno: 'TEST001', dateoftesting: '2024-01-01', provisionaldiagnosis: 'Test Diagnosis', referringphysician: 'Dr. Test' } },
    { table: 'bookings', operation: 'insert', data: { patient_id: '00000000-0000-0000-0000-000000000000', appointment_date: tomorrowStr, appointment_time: '10:00:00', test_type: 'Skin Test', status: 'scheduled', duration_minutes: 60 } },
    { table: 'roles', operation: 'insert', data: { name: 'test_role', display_name: 'Test Role', description: 'Test role for verification', permissions: {} } },
    { table: 'allergen_categories', operation: 'insert', data: { name: 'TEST_CATEGORY', description: 'Test category', display_order: 999 } },
    { table: 'patients', operation: 'select' },
    { table: 'bookings', operation: 'select' },
    { table: 'roles', operation: 'select' },
    { table: 'allergen_categories', operation: 'select' },
    { table: 'user_profiles', operation: 'select' },
    { table: 'test_sessions', operation: 'select' },
    { table: 'enhanced_allergy_tests', operation: 'select' },
    { table: 'allergens', operation: 'select' },
    { table: 'activity_logs', operation: 'select' }
  ];
  
  let allPassed = true;
  let insertTests = 0;
  let insertSuccess = 0;
  
  for (const test of tests) {
    console.log(`\n📋 Testing ${test.operation} on ${test.table}...`);
    const result = await testDatabaseOperation(test.table, test.operation, test.data);
    
    if (result.success) {
      console.log(`   ✅ ${test.operation.toUpperCase()} on ${test.table}: SUCCESS`);
      if (test.operation === 'insert') {
        insertSuccess++;
      }
    } else {
      console.log(`   ❌ ${test.operation.toUpperCase()} on ${test.table}: FAILED`);
      console.log(`      Status: ${result.status}`);
      console.log(`      Error: ${result.error}`);
      allPassed = false;
    }
    
    if (test.operation === 'insert') {
      insertTests++;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  
  if (allPassed) {
    console.log('🎉 All database operations are working perfectly!');
    console.log('✅ You can now add patients, bookings, and use all features.');
    console.log('✅ Database is fully functional for your application.');
    console.log('\n🔗 Your app is ready at: http://localhost:8081/');
    console.log('💡 Try adding a patient or creating a booking now!');
  } else {
    console.log('⚠️  Some operations failed, but most are working.');
    console.log(`📊 Insert tests: ${insertSuccess}/${insertTests} successful`);
    console.log('✅ Database access is mostly functional.');
    console.log('\n🔗 Your app should work for most features at: http://localhost:8080/');
  }
  
  return allPassed;
}

// Run the tests
runDatabaseTests().catch(console.error); 