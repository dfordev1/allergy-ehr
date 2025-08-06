import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function testDiagnosisConstraints() {
  console.log('🔍 Testing Diagnosis Constraint Issues');
  console.log('=' .repeat(50));
  
  const timestamp = Date.now();
  
  // Test cases with different diagnosis lengths
  const testCases = [
    {
      name: `Test Patient Short ${timestamp}`,
      age: 30,
      sex: 'Male',
      labno: `TEST_SHORT_${timestamp}`,
      dateoftesting: new Date().toISOString().split('T')[0],
      provisionaldiagnosis: 'AB', // 2 characters - should fail
      referringphysician: 'Dr. Test'
    },
    {
      name: `Test Patient Exact ${timestamp}`,
      age: 30,
      sex: 'Male',
      labno: `TEST_EXACT_${timestamp}`,
      dateoftesting: new Date().toISOString().split('T')[0],
      provisionaldiagnosis: 'ABC', // 3 characters - should pass
      referringphysician: 'Dr. Test'
    },
    {
      name: `Test Patient Long ${timestamp}`,
      age: 30,
      sex: 'Male',
      labno: `TEST_LONG_${timestamp}`,
      dateoftesting: new Date().toISOString().split('T')[0],
      provisionaldiagnosis: 'Allergic Rhinitis', // Long diagnosis - should pass
      referringphysician: 'Dr. Test'
    },
    {
      name: `Test Patient Spaces ${timestamp}`,
      age: 30,
      sex: 'Male',
      labno: `TEST_SPACES_${timestamp}`,
      dateoftesting: new Date().toISOString().split('T')[0],
      provisionaldiagnosis: '  A  ', // 3 chars with spaces - should pass (trimmed)
      referringphysician: 'Dr. Test'
    },
    {
      name: `Test Patient Empty ${timestamp}`,
      age: 30,
      sex: 'Male',
      labno: `TEST_EMPTY_${timestamp}`,
      dateoftesting: new Date().toISOString().split('T')[0],
      provisionaldiagnosis: '', // Empty - should fail
      referringphysician: 'Dr. Test'
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n📋 Testing: "${testCase.provisionaldiagnosis}" (${testCase.provisionaldiagnosis.length} chars)`);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(testCase)
      });
      
      if (response.ok) {
        console.log(`   ✅ SUCCESS: Diagnosis "${testCase.provisionaldiagnosis}" was accepted`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FAILED: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }
  
  // Clean up test records
  console.log('\n🧹 Cleaning up test records...');
  for (const testCase of testCases) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/patients?labno=eq.${testCase.labno}`, {
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
  
  console.log('\n📋 DIAGNOSIS CONSTRAINT RULES:');
  console.log('- Must be at least 3 characters long (after trimming)');
  console.log('- Cannot be empty or null');
  console.log('- Spaces are trimmed before length check');
  console.log('- Examples: "AB" (2 chars) = FAIL, "ABC" (3 chars) = PASS');
}

// Run the test
testDiagnosisConstraints().catch(console.error); 