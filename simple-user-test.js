import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dmcuunucjmmofdfvteta.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserCreation() {
  console.log('🧪 Testing User Creation After Database Fix...\n');

  const testCredentials = [
    { email: 'test@skintrack.com', password: 'test123456' },
    { email: 'admin@clinic.com', password: 'admin123456' },
    { email: 'doctor@example.com', password: 'doctor123456' }
  ];

  for (const creds of testCredentials) {
    console.log(`Testing: ${creds.email}`);
    
    // Try to sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: creds.email,
      password: creds.password,
      options: {
        emailRedirectTo: undefined
      }
    });

    if (signUpError) {
      console.log(`❌ SignUp failed: ${signUpError.message}`);
      
      // Try to sign in instead (user might already exist)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password
      });

      if (signInError) {
        console.log(`❌ SignIn failed: ${signInError.message}`);
      } else {
        console.log(`✅ SignIn successful for ${creds.email}`);
        console.log(`   User ID: ${signInData.user.id}`);
        
        // Test booking access
        const { data: bookings, error: bookingError } = await supabase
          .from('bookings')
          .select('id')
          .limit(1);
          
        if (bookingError) {
          console.log(`   ❌ Booking access: ${bookingError.message}`);
        } else {
          console.log(`   ✅ Booking access: OK`);
        }
        
        console.log('\n🎉 SUCCESS! Use these credentials:');
        console.log(`   Email: ${creds.email}`);
        console.log(`   Password: ${creds.password}`);
        console.log('   Open http://localhost:8082 and sign in!\n');
        return;
      }
    } else {
      console.log(`✅ SignUp successful for ${creds.email}`);
      console.log(`   User ID: ${signUpData.user.id}`);
      
      console.log('\n🎉 SUCCESS! Use these credentials:');
      console.log(`   Email: ${creds.email}`);
      console.log(`   Password: ${creds.password}`);
      console.log('   Open http://localhost:8082 and sign in!\n');
      return;
    }
  }

  console.log('❌ All test credentials failed. The database authentication issue persists.');
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Apply the SQL fix: Run the database-fix.sql in your Supabase SQL editor');
  console.log('2. Or try the web interface directly at http://localhost:8082');
  console.log('3. Or use the bypass method: node bypass-auth-temporarily.js');
}

testUserCreation().catch(console.error);