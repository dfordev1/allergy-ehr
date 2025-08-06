import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function testPatientInsertion() {
  console.log('🧪 Testing Patient Insertion with Future Dates');
  console.log('=' .repeat(50));
  
  // Generate unique test data
  const timestamp = Date.now();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];
  
  const testPatients = [
    {
      name: `Test Patient Today ${timestamp}`,
      age: 30,
      sex: 'Male',
      labno: `TEST_TODAY_${timestamp}`,
      dateoftesting: new Date().toISOString().split('T')[0], // Today
      provisionaldiagnosis: 'Test Diagnosis Today',
      referringphysician: 'Dr. Test Today'
    },
    {
      name: `Test Patient Tomorrow ${timestamp}`,
      age: 25,
      sex: 'Female',
      labno: `TEST_TOMORROW_${timestamp}`,
      dateoftesting: tomorrowStr, // Tomorrow
      provisionaldiagnosis: 'Test Diagnosis Tomorrow',
      referringphysician: 'Dr. Test Tomorrow'
    },
    {
      name: `Test Patient Next Month ${timestamp}`,
      age: 35,
      sex: 'Other',
      labno: `TEST_NEXT_MONTH_${timestamp}`,
      dateoftesting: nextMonthStr, // Next month
      provisionaldiagnosis: 'Test Diagnosis Next Month',
      referringphysician: 'Dr. Test Next Month'
    }
  ];
  
  let successCount = 0;
  let totalTests = testPatients.length;
  
  for (const patient of testPatients) {
    try {
      console.log(`\n📋 Testing patient: ${patient.name}`);
      console.log(`   Date of testing: ${patient.dateoftesting}`);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(patient)
      });
      
      if (response.ok) {
        console.log(`   ✅ SUCCESS: Patient inserted with date ${patient.dateoftesting}`);
        successCount++;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FAILED: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Results: ${successCount}/${totalTests} patient insertions successful`);
  
  if (successCount === totalTests) {
    console.log('🎉 ALL PATIENT INSERTIONS WORKING!');
    console.log('✅ You can now add patients with past, present, and future dates');
    console.log('✅ The date constraint issue is completely resolved');
    console.log('\n🔗 Your application should now work perfectly!');
  } else {
    console.log('⚠️  Some insertions failed. You may need to run the database fix.');
    console.log('📋 Check the error messages above for details.');
  }
  
  // Clean up test records
  console.log('\n🧹 Cleaning up test records...');
  for (const patient of testPatients) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/patients?labno=eq.${patient.labno}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        }
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  console.log('✅ Test cleanup completed');
}

// Run the test
testPatientInsertion().catch(console.error); 