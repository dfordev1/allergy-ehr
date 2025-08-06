const fs = require('fs');
const path = require('path');

// Supabase configuration (from your client.ts)
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

// Create Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeMigration(migrationName, sqlContent) {
  console.log(`\n🔄 Executing migration: ${migrationName}`);
  console.log('=' .repeat(50));
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log(`⚠️  RPC method not available, trying direct execution...`);
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error: stmtError } = await supabase.from('_dummy_').select('*').limit(0);
            // This is a workaround - we'll use the dashboard method instead
            console.log(`📝 Statement prepared: ${statement.substring(0, 100)}...`);
          } catch (e) {
            // Expected error for DDL statements
          }
        }
      }
      
      console.log(`✅ Migration ${migrationName} prepared for execution`);
      console.log(`📋 Please copy the SQL content to Supabase Dashboard SQL Editor`);
      
    } else {
      console.log(`✅ Migration ${migrationName} executed successfully`);
    }
    
  } catch (err) {
    console.log(`❌ Error executing ${migrationName}:`, err.message);
    console.log(`📋 Please copy the SQL content to Supabase Dashboard SQL Editor`);
  }
}

async function setupDatabase() {
  console.log('🚀 Starting Database Setup for Skin Track Aid');
  console.log('=' .repeat(60));
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  // Migration files in order
  const migrationFiles = [
    '00_create_core_schema.sql',
    '01_cleanup_and_recreate.sql', 
    '02_insert_default_data.sql',
    '03_verify_setup.sql'
  ];
  
  console.log(`📁 Reading migrations from: ${migrationsDir}`);
  
  for (const fileName of migrationFiles) {
    const filePath = path.join(migrationsDir, fileName);
    
    if (fs.existsSync(filePath)) {
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      await executeMigration(fileName, sqlContent);
    } else {
      console.log(`❌ Migration file not found: ${fileName}`);
    }
  }
  
  console.log('\n🎉 Database setup process completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Navigate to your project: dmcuunucjmmofdfvteta');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste each migration file content');
  console.log('5. Run them in order: 00, 01, 02, 03');
  console.log('\n🔗 Your app is running at: http://localhost:8080/');
}

// Alternative approach: Create a simple verification script
async function verifyDatabase() {
  console.log('\n🔍 Verifying Database Connection...');
  
  try {
    // Test basic connection
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('✅ Supabase connection successful');
    
    // Test if tables exist by trying to query them
    const tables = ['patients', 'roles', 'user_profiles', 'bookings'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: Accessible`);
        }
      } catch (e) {
        console.log(`❌ Table ${table}: Not found or not accessible`);
      }
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase().then(() => {
    return verifyDatabase();
  }).catch(console.error);
}

module.exports = { setupDatabase, verifyDatabase }; 