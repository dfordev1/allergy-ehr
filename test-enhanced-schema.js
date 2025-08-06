import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function testEnhancedSchema() {
  console.log('🔍 Testing Enhanced Allergy Tests Schema');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Get table structure
    console.log('\n📋 Test 1: Getting enhanced_allergy_tests table structure...');
    const response1 = await fetch(`${SUPABASE_URL}/rest/v1/enhanced_allergy_tests?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (response1.ok) {
      const data = await response1.json();
      if (data && data.length > 0) {
        console.log('   ✅ Table structure:');
        console.log('   Columns found:', Object.keys(data[0]));
      } else {
        console.log('   ℹ️  Table exists but is empty');
        
        // Try to get schema from information_schema
        console.log('\n📋 Test 2: Getting schema from information_schema...');
        const response2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_table_columns?table_name=enhanced_allergy_tests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ table_name: 'enhanced_allergy_tests' })
        });
        
        if (response2.ok) {
          const schemaData = await response2.json();
          console.log('   ✅ Schema data:', schemaData);
        } else {
          console.log('   ❌ Could not get schema data');
        }
      }
    } else {
      const error = await response1.text();
      console.log(`   ❌ Failed to get table structure: ${error}`);
    }
    
    // Test 3: Try to insert with minimal required fields
    console.log('\n📋 Test 3: Trying minimal insert...');
    
    // First get a patient
    const patientResponse = await fetch(`${SUPABASE_URL}/rest/v1/patients?select=id,name,labno&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    let patientId = null;
    let patientName = '';
    let patientLabNo = '';
    
    if (patientResponse.ok) {
      const patients = await patientResponse.json();
      if (patients && patients.length > 0) {
        patientId = patients[0].id;
        patientName = patients[0].name;
        patientLabNo = patients[0].labno;
        console.log(`   ✅ Found patient: ${patientId}`);
      }
    }
    
    if (!patientId) {
      console.log('   ❌ No patients found for testing');
      return;
    }
    
    // Try minimal insert
    const minimalTest = {
      patient_id: patientId,
      patient_name: patientName,
      lab_no: patientLabNo,
      date_of_testing: new Date().toISOString().split('T')[0],
      test_results: { allergens: [] },
      controls: { positive: {}, negative: {} }
    };
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/enhanced_allergy_tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(minimalTest)
    });
    
    if (insertResponse.ok) {
      const newTest = await insertResponse.json();
      console.log(`   ✅ Minimal insert successful: ${newTest[0].id}`);
      console.log('   📋 Inserted data:', newTest[0]);
      
      // Clean up
      await fetch(`${SUPABASE_URL}/rest/v1/enhanced_allergy_tests?id=eq.${newTest[0].id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        }
      });
      console.log('   ✅ Test record cleaned up');
    } else {
      const error = await insertResponse.text();
      console.log(`   ❌ Minimal insert failed: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

// Run the test
testEnhancedSchema().catch(console.error); 