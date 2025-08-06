import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function testBookingsSchema() {
  console.log('🔍 Testing Bookings Table Schema');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Try to select with booking_date
    console.log('\n📋 Test 1: Trying to select with booking_date...');
    const response1 = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=id,booking_date&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      }
    });
    
    if (response1.ok) {
      console.log('   ✅ SUCCESS: booking_date column exists');
    } else {
      const error1 = await response1.text();
      console.log(`   ❌ FAILED: ${response1.status} - ${error1}`);
    }
    
    // Test 2: Try to select with appointment_date
    console.log('\n📋 Test 2: Trying to select with appointment_date...');
    const response2 = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=id,appointment_date&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      }
    });
    
    if (response2.ok) {
      console.log('   ✅ SUCCESS: appointment_date column exists');
    } else {
      const error2 = await response2.text();
      console.log(`   ❌ FAILED: ${response2.status} - ${error2}`);
    }
    
    // Test 3: Get table structure
    console.log('\n📋 Test 3: Getting table structure...');
    const response3 = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (response3.ok) {
      const data = await response3.json();
      if (data && data.length > 0) {
        console.log('   ✅ Table structure:');
        console.log('   Columns found:', Object.keys(data[0]));
      } else {
        console.log('   ℹ️  Table exists but is empty');
      }
    } else {
      const error3 = await response3.text();
      console.log(`   ❌ FAILED: ${response3.status} - ${error3}`);
    }
    
    // Test 4: Try to insert with booking_date
    console.log('\n📋 Test 4: Trying to insert with booking_date...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const testBooking1 = {
      patient_id: '00000000-0000-0000-0000-000000000000',
      booking_date: tomorrowStr,
      booking_time: '10:00:00',
      test_type: 'Schema Test',
      status: 'scheduled'
    };
    
    const response4 = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testBooking1)
    });
    
    if (response4.ok) {
      console.log('   ✅ SUCCESS: Can insert with booking_date');
    } else {
      const error4 = await response4.text();
      console.log(`   ❌ FAILED: ${response4.status} - ${error4}`);
    }
    
    // Test 5: Try to insert with appointment_date
    console.log('\n📋 Test 5: Trying to insert with appointment_date...');
    const testBooking2 = {
      patient_id: '00000000-0000-0000-0000-000000000000',
      appointment_date: tomorrowStr,
      appointment_time: '11:00:00',
      test_type: 'Schema Test 2',
      status: 'scheduled'
    };
    
    const response5 = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testBooking2)
    });
    
    if (response5.ok) {
      console.log('   ✅ SUCCESS: Can insert with appointment_date');
    } else {
      const error5 = await response5.text();
      console.log(`   ❌ FAILED: ${response5.status} - ${error5}`);
    }
    
    // Clean up test records
    console.log('\n🧹 Cleaning up test records...');
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/bookings?test_type=eq.Schema Test`, {
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
    
    console.log('✅ Test cleanup completed');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

// Run the test
testBookingsSchema().catch(console.error); 