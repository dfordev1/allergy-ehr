import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dmcuunucjmmofdfvteta.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function manualUserCreation() {
  console.log('🔐 Manual User Creation for Skin Track Aid\n');

  // Try different email addresses
  const testUsers = [
    { email: 'admin@test.com', password: 'admin123!' },
    { email: 'doctor@clinic.com', password: 'doctor123!' },
    { email: 'user@skintrack.com', password: 'user123!' },
    { email: 'test@example.com', password: 'test123!' }
  ];

  for (const user of testUsers) {
    console.log(`\n🧪 Trying to create user: ${user.email}`);
    
    try {
      // Method 1: Standard signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          emailRedirectTo: undefined, // Skip email verification
        }
      });

      if (signUpError) {
        console.log('   ❌ SignUp Error:', signUpError.message);
        
        // Method 2: Try to sign in if user exists
        console.log('   🔄 Trying to sign in instead...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: user.password,
        });

        if (signInError) {
          console.log('   ❌ SignIn Error:', signInError.message);
          continue;
        }

        if (signInData.user) {
          console.log('   ✅ Successfully signed in existing user!');
          console.log('   📧 Email:', signInData.user.email);
          console.log('   🆔 User ID:', signInData.user.id);
          console.log('   🔑 Session:', signInData.session ? 'Active' : 'None');
          
          await testUserAccess(signInData.user);
          return { success: true, user: signInData.user, credentials: user };
        }
      } else if (signUpData.user) {
        console.log('   ✅ User created successfully!');
        console.log('   📧 Email:', signUpData.user.email);
        console.log('   🆔 User ID:', signUpData.user.id);
        console.log('   🔑 Session:', signUpData.session ? 'Active' : 'None');
        
        await testUserAccess(signUpData.user);
        return { success: true, user: signUpData.user, credentials: user };
      }
    } catch (error) {
      console.log('   ❌ Unexpected error:', error.message);
    }
  }

  return { success: false };
}

async function testUserAccess(user) {
  console.log('\n🔍 Testing user access...');
  
  try {
    // Test 1: Check if we can read patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, name')
      .limit(1);

    if (patientsError) {
      console.log('   ❌ Patients access:', patientsError.message);
    } else {
      console.log('   ✅ Patients access: OK');
      console.log('   📊 Patient count:', patients?.length || 0);
    }

    // Test 2: Check if we can read bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);

    if (bookingsError) {
      console.log('   ❌ Bookings access:', bookingsError.message);
    } else {
      console.log('   ✅ Bookings access: OK');
      console.log('   📅 Booking count:', bookings?.length || 0);
    }

    // Test 3: Try to create a simple patient (if none exist)
    if (!patients || patients.length === 0) {
      console.log('   🔄 Creating test patient...');
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          name: 'Test Patient',
          age: 25,
          sex: 'Male',
          labno: 'TEST' + Date.now(),
          dateoftesting: new Date().toISOString().split('T')[0],
          provisionaldiagnosis: 'Test diagnosis',
          referringphysician: 'Dr. Test',
          contactinfo: { phone: '123-456-7890' }
        })
        .select()
        .single();

      if (patientError) {
        console.log('   ❌ Patient creation:', patientError.message);
      } else {
        console.log('   ✅ Test patient created:', newPatient.name);
      }
    }

  } catch (error) {
    console.log('   ❌ Access test error:', error.message);
  }
}

// Run the manual user creation
manualUserCreation().then((result) => {
  if (result.success) {
    console.log('\n🎉 SUCCESS! User created and tested!');
    console.log('\n📋 YOUR LOGIN CREDENTIALS:');
    console.log('   Email:', result.credentials.email);
    console.log('   Password:', result.credentials.password);
    console.log('\n🌐 Open http://localhost:8082 and use these credentials!');
    console.log('\n💡 TIP: The application is running on port 8082');
  } else {
    console.log('\n❌ Could not create any users automatically.');
    console.log('\n🔧 ALTERNATIVE METHODS:');
    console.log('1. Use the web interface at http://localhost:8082');
    console.log('2. Click "Sign Up" and create an account manually');
    console.log('3. Use any email/password combination');
  }
}).catch(console.error);