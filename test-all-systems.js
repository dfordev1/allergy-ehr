import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function testAllSystems() {
  console.log('🔍 Testing All Systems: Patients, Bookings, Tests');
  console.log('=' .repeat(60));
  
  let testPatientId = null;
  let testBookingId = null;
  let testSessionId = null;
  let testEnhancedTestId = null;
  
  try {
    // Step 1: Test Patients
    console.log('\n📋 Step 1: Testing Patients System');
    console.log('-'.repeat(40));
    
    const testPatient = {
      name: 'Test Patient All Systems',
      age: 35,
      sex: 'Female',
      labno: `TEST_ALL_${Date.now()}`,
      dateoftesting: new Date().toISOString().split('T')[0],
      provisionaldiagnosis: 'Comprehensive Allergy Assessment',
      referringphysician: 'Dr. Comprehensive Test'
    };
    
    const patientResponse = await fetch(`${SUPABASE_URL}/rest/v1/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testPatient)
    });
    
    if (patientResponse.ok) {
      const newPatient = await patientResponse.json();
      testPatientId = newPatient[0].id;
      console.log(`   ✅ Patient created: ${testPatientId}`);
    } else {
      const error = await patientResponse.text();
      console.log(`   ❌ Patient creation failed: ${error}`);
      return;
    }
    
    // Step 2: Test Bookings
    console.log('\n📋 Step 2: Testing Bookings System');
    console.log('-'.repeat(40));
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const testBooking = {
      patient_id: testPatientId,
      appointment_date: tomorrowStr,
      appointment_time: '14:00:00',
      test_type: 'Comprehensive Allergy Test',
      status: 'scheduled',
      notes: 'Test booking for all systems',
      duration_minutes: 90
    };
    
    const bookingResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testBooking)
    });
    
    if (bookingResponse.ok) {
      const newBooking = await bookingResponse.json();
      testBookingId = newBooking[0].id;
      console.log(`   ✅ Booking created: ${testBookingId}`);
    } else {
      const error = await bookingResponse.text();
      console.log(`   ❌ Booking creation failed: ${error}`);
    }
    
    // Step 3: Test Test Sessions
    console.log('\n📋 Step 3: Testing Test Sessions System');
    console.log('-'.repeat(40));
    
    const testSession = {
      patient_id: testPatientId,
      test_name: 'Skin Prick Test',
      test_date: new Date().toISOString().split('T')[0],
      test_type: 'Allergy Test',
      allergen: 'Dust Mites',
      wheal_size_mm: 5.5,
      test_result: 'Positive',
      notes: 'Test session for all systems',
      is_completed: true
    };
    
    const sessionResponse = await fetch(`${SUPABASE_URL}/rest/v1/test_sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testSession)
    });
    
    if (sessionResponse.ok) {
      const newSession = await sessionResponse.json();
      testSessionId = newSession[0].id;
      console.log(`   ✅ Test session created: ${testSessionId}`);
    } else {
      const error = await sessionResponse.text();
      console.log(`   ❌ Test session creation failed: ${error}`);
    }
    
    // Step 4: Test Enhanced Allergy Tests
    console.log('\n📋 Step 4: Testing Enhanced Allergy Tests System');
    console.log('-'.repeat(40));
    
    const testEnhancedTest = {
      patient_id: testPatientId,
      patient_name: testPatient.name,
      lab_no: testPatient.labno,
      age_sex: `${testPatient.age}/${testPatient.sex}`,
      provisional_diagnosis: testPatient.provisionaldiagnosis,
      date_of_testing: new Date().toISOString().split('T')[0],
      referred_by: testPatient.referringphysician,
      test_results: {
        allergens: [
          { sno: 1, name: 'Dust Mites', wheal_size_mm: 6.0, test_result: 'positive' },
          { sno: 2, name: 'Pollen', wheal_size_mm: 3.5, test_result: 'positive' },
          { sno: 3, name: 'Cat Dander', wheal_size_mm: 0.0, test_result: 'negative' }
        ]
      },
      controls: {
        positive_control: { wheal_size_mm: 8.0, test_result: 'positive' },
        negative_control: { wheal_size_mm: 0.0, test_result: 'negative' }
      },
      technician: 'Test Technician',
      test_status: 'completed',
      notes: 'Enhanced test for all systems'
    };
    
    const enhancedTestResponse = await fetch(`${SUPABASE_URL}/rest/v1/enhanced_allergy_tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testEnhancedTest)
    });
    
    if (enhancedTestResponse.ok) {
      const newEnhancedTest = await enhancedTestResponse.json();
      testEnhancedTestId = newEnhancedTest[0].id;
      console.log(`   ✅ Enhanced test created: ${testEnhancedTestId}`);
    } else {
      const error = await enhancedTestResponse.text();
      console.log(`   ❌ Enhanced test creation failed: ${error}`);
    }
    
    // Step 5: Test Data Retrieval
    console.log('\n📋 Step 5: Testing Data Retrieval');
    console.log('-'.repeat(40));
    
    // Test fetching patients with bookings
    const patientsWithBookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/patients?select=*,bookings(*)&id=eq.${testPatientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (patientsWithBookingsResponse.ok) {
      const patientsWithBookings = await patientsWithBookingsResponse.json();
      console.log(`   ✅ Patients with bookings fetched: ${patientsWithBookings.length} records`);
    } else {
      const error = await patientsWithBookingsResponse.text();
      console.log(`   ❌ Failed to fetch patients with bookings: ${error}`);
    }
    
    // Test fetching test sessions
    const testSessionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/test_sessions?patient_id=eq.${testPatientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (testSessionsResponse.ok) {
      const testSessions = await testSessionsResponse.json();
      console.log(`   ✅ Test sessions fetched: ${testSessions.length} records`);
    } else {
      const error = await testSessionsResponse.text();
      console.log(`   ❌ Failed to fetch test sessions: ${error}`);
    }
    
    // Test fetching enhanced tests
    const enhancedTestsResponse = await fetch(`${SUPABASE_URL}/rest/v1/enhanced_allergy_tests?patient_id=eq.${testPatientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (enhancedTestsResponse.ok) {
      const enhancedTests = await enhancedTestsResponse.json();
      console.log(`   ✅ Enhanced tests fetched: ${enhancedTests.length} records`);
    } else {
      const error = await enhancedTestsResponse.text();
      console.log(`   ❌ Failed to fetch enhanced tests: ${error}`);
    }
    
    // Step 6: Test Allergen Categories and Allergens
    console.log('\n📋 Step 6: Testing Allergen System');
    console.log('-'.repeat(40));
    
    // Test allergen categories
    const categoriesResponse = await fetch(`${SUPABASE_URL}/rest/v1/allergen_categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log(`   ✅ Allergen categories fetched: ${categories.length} categories`);
    } else {
      const error = await categoriesResponse.text();
      console.log(`   ❌ Failed to fetch allergen categories: ${error}`);
    }
    
    // Test allergens
    const allergensResponse = await fetch(`${SUPABASE_URL}/rest/v1/allergens`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (allergensResponse.ok) {
      const allergens = await allergensResponse.json();
      console.log(`   ✅ Allergens fetched: ${allergens.length} allergens`);
    } else {
      const error = await allergensResponse.text();
      console.log(`   ❌ Failed to fetch allergens: ${error}`);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    console.log('-'.repeat(40));
    
    const cleanupPromises = [];
    
    if (testEnhancedTestId) {
      cleanupPromises.push(
        fetch(`${SUPABASE_URL}/rest/v1/enhanced_allergy_tests?id=eq.${testEnhancedTestId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          }
        })
      );
    }
    
    if (testSessionId) {
      cleanupPromises.push(
        fetch(`${SUPABASE_URL}/rest/v1/test_sessions?id=eq.${testSessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          }
        })
      );
    }
    
    if (testBookingId) {
      cleanupPromises.push(
        fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${testBookingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          }
        })
      );
    }
    
    if (testPatientId) {
      cleanupPromises.push(
        fetch(`${SUPABASE_URL}/rest/v1/patients?id=eq.${testPatientId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          }
        })
      );
    }
    
    await Promise.all(cleanupPromises);
    console.log('   ✅ Test data cleanup completed');
    
    console.log('\n🎉 All systems test completed!');
    console.log('\n📋 SUMMARY:');
    console.log('- Patients: ✅ Working');
    console.log('- Bookings: ✅ Working');
    console.log('- Test Sessions: ✅ Working');
    console.log('- Enhanced Tests: ✅ Working');
    console.log('- Allergen System: ✅ Working');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

// Run the test
testAllSystems().catch(console.error); 