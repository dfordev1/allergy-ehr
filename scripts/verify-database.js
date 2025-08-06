import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function testTable(tableName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=5`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (response.status === 200) {
      const data = await response.json();
      return { 
        exists: true, 
        count: data.length,
        sample: data.slice(0, 2) // Show first 2 records as sample
      };
    } else {
      return { exists: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function verifyDatabase() {
  console.log('🔍 Detailed Database Verification');
  console.log('=' .repeat(50));
  
  const tables = [
    'patients',
    'roles', 
    'user_profiles',
    'test_sessions',
    'enhanced_allergy_tests',
    'bookings',
    'activity_logs',
    'allergen_categories',
    'allergens'
  ];
  
  let allGood = true;
  
  for (const table of tables) {
    console.log(`\n📋 Testing table: ${table}`);
    const result = await testTable(table);
    
    if (result.exists) {
      console.log(`   ✅ ${table}: ${result.count} records found`);
      if (result.sample && result.sample.length > 0) {
        console.log(`   📝 Sample data:`, JSON.stringify(result.sample, null, 2));
      }
    } else {
      console.log(`   ❌ ${table}: ${result.error}`);
      allGood = false;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  
  if (allGood) {
    console.log('🎉 All database tables are working correctly!');
    console.log('\n✅ Your application should be fully functional.');
    console.log('🔗 Open http://localhost:8080/ to use the app');
    console.log('🔍 Go to the Debug tab to see the database connection test');
  } else {
    console.log('⚠️  Some database tables may need attention.');
    console.log('📋 Check the errors above and run the migrations if needed.');
  }
  
  return allGood;
}

// Run verification
verifyDatabase().catch(console.error); 