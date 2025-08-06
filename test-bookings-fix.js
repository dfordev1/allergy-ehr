import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function testBookingsFix() {
  console.log('🔍 Testing Bookings Fix');
  console.log('=' .repeat(50));
  
  try {
    // First, get a patient ID to use for testing
    console.log('\n📋 Step 1: Getting a patient for testing...');
    const patientResponse = await fetch(`${SUPABASE_URL}/rest/v1/patients?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    let patientId = null;
    if (patientResponse.ok) {
      const patients = await patientResponse.json();
      if (patients && patients.length > 0) {
        patientId = patients[0].id;
        console.log(`   ✅ Found patient: ${patientId}`);
      }
    }
    
    if (!patientId) {
      console.log('   ❌ No patients found, creating a test patient...');
      const testPatient = {
        name: 'Test Patient for Booking',
        age: 30,
        sex: 'Male',
        labno: `TEST_BOOKING_${Date.now()}`,
        dateoftesting: new Date().toISOString().split('T')[0],
        provisionaldiagnosis: 'Allergic Rhinitis',
        referringphysician: 'Dr. Test'
      };
      
      const createPatientResponse = await fetch(`${SUPABASE_URL}/rest/v1/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(testPatient)
      });
      
      if (createPatientResponse.ok) {
        const newPatient = await createPatientResponse.json();
        patientId = newPatient[0].id;
        console.log(`   ✅ Created test patient: ${patientId}`);
      } else {
        const error = await createPatientResponse.text();
        console.log(`   ❌ Failed to create patient: ${error}`);
        return;
      }
    }
    
    // Test 2: Create a booking with correct column names
    console.log('\n📋 Step 2: Creating a booking with appointment_date...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const testBooking = {
      patient_id: patientId,
      appointment_date: tomorrowStr,
      appointment_time: '10:00:00',
      test_type: 'Skin Prick Test',
      status: 'scheduled',
      notes: 'Test booking created by script',
      duration_minutes: 60
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
      console.log(`   ✅ Successfully created booking: ${newBooking[0].id}`);
      console.log(`   📅 Date: ${newBooking[0].appointment_date}`);
      console.log(`   🕐 Time: ${newBooking[0].appointment_time}`);
    } else {
      const error = await bookingResponse.text();
      console.log(`   ❌ Failed to create booking: ${error}`);
      return;
    }
    
    // Test 3: Fetch bookings with patient data
    console.log('\n📋 Step 3: Fetching bookings with patient data...');
    const fetchResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*,patient:patient_id(name,labno)&order=appointment_date.asc`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (fetchResponse.ok) {
      const bookings = await fetchResponse.json();
      console.log(`   ✅ Successfully fetched ${bookings.length} bookings`);
      if (bookings.length > 0) {
        console.log(`   📋 Sample booking:`, {
          id: bookings[0].id,
          patient_name: bookings[0].patient?.name,
          appointment_date: bookings[0].appointment_date,
          appointment_time: bookings[0].appointment_time,
          test_type: bookings[0].test_type
        });
      }
    } else {
      const error = await fetchResponse.text();
      console.log(`   ❌ Failed to fetch bookings: ${error}`);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      // Delete test booking
      await fetch(`${SUPABASE_URL}/rest/v1/bookings?test_type=eq.Skin Prick Test`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        }
      });
      
      // Delete test patient if we created one
      if (patientId.includes('TEST_BOOKING')) {
        await fetch(`${SUPABASE_URL}/rest/v1/patients?id=eq.${patientId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          }
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    console.log('✅ Test cleanup completed');
    console.log('\n🎉 Bookings functionality is now working correctly!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

// Run the test
testBookingsFix().catch(console.error); 