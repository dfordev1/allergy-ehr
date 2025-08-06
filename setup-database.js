import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/patients?select=*&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Database connection successful');
      return true;
    } else {
      console.log('❌ Database connection failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function checkTableData() {
  console.log('\n📊 Checking table data...');
  
  const tables = ['roles', 'allergen_categories', 'allergens'];
  let hasData = false;
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.length > 0) {
          console.log(`✅ ${table}: Has data`);
          hasData = true;
        } else {
          console.log(`⚠️  ${table}: Empty`);
        }
      }
    } catch (error) {
      console.log(`❌ ${table}: Error checking`);
    }
  }
  
  return hasData;
}

async function main() {
  console.log('🚀 Skin Track Aid - Database Setup Wizard');
  console.log('=' .repeat(60));
  
  // Test connection
  const isConnected = await testDatabaseConnection();
  
  if (!isConnected) {
    console.log('\n❌ Cannot connect to database. Please check your internet connection.');
    rl.close();
    return;
  }
  
  // Check if data exists
  const hasData = await checkTableData();
  
  if (hasData) {
    console.log('\n🎉 Database is already set up and has data!');
    console.log('Your application should be fully functional.');
    console.log('\n🔗 Open your app at: http://localhost:8080/');
    rl.close();
    return;
  }
  
  console.log('\n📋 Database needs setup. Here are your options:');
  console.log('\n1. 🔧 Quick Fix (Recommended)');
  console.log('   - Fix RLS policies in Supabase Dashboard');
  console.log('   - Run automated data insertion');
  console.log('\n2. 📖 Manual Setup');
  console.log('   - Follow step-by-step instructions');
  console.log('   - Copy SQL files manually');
  console.log('\n3. 🔍 Just Check Status');
  console.log('   - Only verify current database state');
  
  const choice = await question('\nEnter your choice (1-3): ');
  
  switch (choice.trim()) {
    case '1':
      await quickFix();
      break;
    case '2':
      await manualSetup();
      break;
    case '3':
      await checkStatus();
      break;
    default:
      console.log('Invalid choice. Exiting...');
  }
  
  rl.close();
}

async function quickFix() {
  console.log('\n🔧 Quick Fix Setup');
  console.log('=' .repeat(40));
  
  console.log('\n📋 Step 1: Fix RLS Policies');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Navigate to your project: dmcuunucjmmofdfvteta');
  console.log('3. Go to SQL Editor in the left sidebar');
  console.log('4. Copy the content from: migration-output/FIX_RLS_POLICIES.sql');
  console.log('5. Paste it into the SQL Editor');
  console.log('6. Click Run');
  
  const ready = await question('\nPress Enter when you\'ve completed Step 1...');
  
  console.log('\n📋 Step 2: Insert Default Data');
  console.log('Running automated data insertion...');
  
  try {
    // Import and run the insert script
    const { main: insertData } = await import('./scripts/insert-default-data.js');
    await insertData();
  } catch (error) {
    console.log('❌ Error running data insertion:', error.message);
    console.log('Please run manually: node scripts/insert-default-data.js');
  }
  
  console.log('\n📋 Step 3: Verify Setup');
  await checkStatus();
}

async function manualSetup() {
  console.log('\n📖 Manual Setup Instructions');
  console.log('=' .repeat(40));
  
  console.log('\n📁 Check the migration-output folder for:');
  console.log('   - FIX_RLS_POLICIES.sql (fix permissions)');
  console.log('   - ALL_MIGRATIONS_COMBINED.sql (complete setup)');
  console.log('   - COMPLETE_SETUP_GUIDE.md (detailed instructions)');
  console.log('   - Individual step files (step-1, step-2, etc.)');
  
  console.log('\n🔗 Your Supabase project: https://supabase.com/dashboard/project/dmcuunucjmmofdfvteta');
  console.log('🔗 Your app: http://localhost:8080/');
  
  console.log('\n📋 Follow the instructions in COMPLETE_SETUP_GUIDE.md');
}

async function checkStatus() {
  console.log('\n🔍 Database Status Check');
  console.log('=' .repeat(40));
  
  try {
    const { verifyDatabase } = await import('./scripts/verify-database.js');
    await verifyDatabase();
  } catch (error) {
    console.log('❌ Error checking status:', error.message);
  }
  
  console.log('\n💡 Pro tip: Open the Debug tab in your app for real-time database status!');
}

// Run the setup wizard
main().catch(console.error); 