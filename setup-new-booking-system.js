import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://dmcuunucjmmofdfvteta.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupNewBookingSystem() {
  console.log('🚀 Setting Up NEW Booking System...\n');

  try {
    // Step 1: Create the simple bookings table
    console.log('1. Creating simple bookings table...');
    
    const { data: createResult, error: createError } = await supabase.rpc('create_simple_bookings_table');
    
    if (createError) {
      console.log('   ⚠️  RPC not available, trying direct table creation...');
      
      // Try direct table operations
      const { error: tableError } = await supabase
        .from('simple_bookings')
        .select('id')
        .limit(1);
        
      if (tableError && tableError.message.includes('does not exist')) {
        console.log('   ❌ Table does not exist and cannot be created via client');
        console.log('   📋 MANUAL SETUP REQUIRED:');
        console.log('   1. Go to your Supabase Dashboard');
        console.log('   2. Open SQL Editor');
        console.log('   3. Run the SQL from create-booking-table.sql');
        return false;
      } else {
        console.log('   ✅ Table already exists or is accessible');
      }
    } else {
      console.log('   ✅ Table created successfully:', createResult);
    }

    // Step 2: Test table access
    console.log('2. Testing table access...');
    
    const { data: testData, error: testError } = await supabase
      .from('simple_bookings')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.log('   ❌ Cannot access table:', testError.message);
      return false;
    }
    
    console.log('   ✅ Table access successful');
    console.log('   📊 Existing bookings:', testData?.length || 0);

    // Step 3: Test creating a booking
    console.log('3. Testing booking creation...');
    
    const testBooking = {
      patient_name: 'Test Patient',
      patient_phone: '123-456-7890',
      appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      appointment_time: '10:00',
      test_type: 'Skin Prick Test',
      notes: 'Test booking created by setup script'
    };

    const { data: newBooking, error: insertError } = await supabase
      .from('simple_bookings')
      .insert([testBooking])
      .select()
      .single();

    if (insertError) {
      console.log('   ❌ Cannot create booking:', insertError.message);
      return false;
    }

    console.log('   ✅ Booking created successfully!');
    console.log('   🆔 Booking ID:', newBooking.id);
    console.log('   👤 Patient:', newBooking.patient_name);

    // Step 4: Test updating the booking
    console.log('4. Testing booking update...');
    
    const { error: updateError } = await supabase
      .from('simple_bookings')
      .update({ status: 'completed' })
      .eq('id', newBooking.id);

    if (updateError) {
      console.log('   ❌ Cannot update booking:', updateError.message);
    } else {
      console.log('   ✅ Booking updated successfully');
    }

    // Step 5: Clean up test booking
    console.log('5. Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('simple_bookings')
      .delete()
      .eq('id', newBooking.id);

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

// Run the setup
setupNewBookingSystem().then((success) => {
  if (success) {
    console.log('\n🎉 NEW BOOKING SYSTEM SETUP COMPLETE!');
    console.log('\n📋 WHAT YOU CAN DO NOW:');
    console.log('1. Open http://localhost:8082/simple-booking');
    console.log('2. Create, edit, and delete bookings');
    console.log('3. No authentication issues!');
    console.log('4. Simple, reliable booking system');
    
    console.log('\n🔗 NAVIGATION:');
    console.log('- Main App: http://localhost:8082');
    console.log('- New Booking System: http://localhost:8082/simple-booking');
    
    console.log('\n✅ The new booking system is ready to use!');
  } else {
    console.log('\n❌ Setup failed. Please run the SQL manually:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy and run the SQL from create-booking-table.sql');
    console.log('3. Then try http://localhost:8082/simple-booking');
  }
}).catch(console.error);