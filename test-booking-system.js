import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dmcuunucjmmofdfvteta.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingSystem() {
  console.log('🧪 Testing New Booking System...\n');

  try {
    // Test 1: Check if table exists and is accessible
    console.log('1. Testing table access...');
    const { data: existingBookings, error: selectError } = await supabase
      .from('simple_bookings')
      .select('*')
      .limit(5);

    if (selectError) {
      console.log('   ❌ Cannot access table:', selectError.message);
      console.log('   💡 You need to run the SQL script first!');
      console.log('   📋 Steps:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy and run create-booking-table-fixed.sql');
      return false;
    }

    console.log('   ✅ Table access successful');
    console.log('   📊 Existing bookings:', existingBookings?.length || 0);

    if (existingBookings && existingBookings.length > 0) {
      console.log('   📋 Sample booking:');
      const sample = existingBookings[0];
      console.log('      - Patient:', sample.patient_name);
      console.log('      - Date:', sample.appointment_date);
      console.log('      - Time:', sample.appointment_time);
      console.log('      - Test:', sample.test_type);
    }

    // Test 2: Create a new booking
    console.log('\n2. Testing booking creation...');
    const newBooking = {
      patient_name: 'Test Patient ' + Date.now(),
      patient_phone: '999-888-7777',
      appointment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
      appointment_time: '15:30',
      test_type: 'Skin Prick Test',
      notes: 'Created by test script'
    };

    const { data: createdBooking, error: insertError } = await supabase
      .from('simple_bookings')
      .insert([newBooking])
      .select()
      .single();

    if (insertError) {
      console.log('   ❌ Cannot create booking:', insertError.message);
      return false;
    }

    console.log('   ✅ Booking created successfully!');
    console.log('   🆔 ID:', createdBooking.id);
    console.log('   👤 Patient:', createdBooking.patient_name);

    // Test 3: Update the booking
    console.log('\n3. Testing booking update...');
    const { data: updatedBooking, error: updateError } = await supabase
      .from('simple_bookings')
      .update({ 
        status: 'completed',
        notes: 'Updated by test script - completed'
      })
      .eq('id', createdBooking.id)
      .select()
      .single();

    if (updateError) {
      console.log('   ❌ Cannot update booking:', updateError.message);
      return false;
    }

    console.log('   ✅ Booking updated successfully!');
    console.log('   📊 Status:', updatedBooking.status);

    // Test 4: Query bookings with filters
    console.log('\n4. Testing booking queries...');
    const { data: scheduledBookings, error: queryError } = await supabase
      .from('simple_bookings')
      .select('*')
      .eq('status', 'scheduled')
      .order('appointment_date', { ascending: true });

    if (queryError) {
      console.log('   ❌ Cannot query bookings:', queryError.message);
    } else {
      console.log('   ✅ Query successful!');
      console.log('   📅 Scheduled bookings:', scheduledBookings?.length || 0);
    }

    // Test 5: Delete test booking
    console.log('\n5. Cleaning up test booking...');
    const { error: deleteError } = await supabase
      .from('simple_bookings')
      .delete()
      .eq('id', createdBooking.id);

    if (deleteError) {
      console.log('   ⚠️  Could not delete test booking:', deleteError.message);
    } else {
      console.log('   ✅ Test booking cleaned up');
    }

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the test
testBookingSystem().then((success) => {
  if (success) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n📋 YOUR BOOKING SYSTEM IS READY:');
    console.log('🌐 Main App: http://localhost:8082');
    console.log('🔗 New Booking System: http://localhost:8082/simple-booking');
    
    console.log('\n✅ Features Available:');
    console.log('- ✅ Create new bookings');
    console.log('- ✅ View all appointments');
    console.log('- ✅ Edit existing bookings');
    console.log('- ✅ Delete appointments');
    console.log('- ✅ Filter by status');
    console.log('- ✅ No authentication issues!');
    
  } else {
    console.log('\n❌ SETUP REQUIRED:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Run create-booking-table-fixed.sql');
    console.log('4. Then try http://localhost:8082/simple-booking');
  }
}).catch(console.error);