import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function executeSQL(sql) {
  try {
    // Try to execute SQL using Supabase's REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    });

    if (response.ok) {
      return { success: true, data: await response.json() };
    } else {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createMigrationFiles() {
  console.log('📁 Creating migration files for manual execution...');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const outputDir = path.join(__dirname, '..', 'migration-output');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const migrationFiles = [
    '00_create_core_schema.sql',
    '01_cleanup_and_recreate.sql', 
    '02_insert_default_data.sql',
    '03_verify_setup.sql'
  ];
  
  let allSQL = '';
  let stepNumber = 1;
  
  for (const fileName of migrationFiles) {
    const filePath = path.join(migrationsDir, fileName);
    
    if (fs.existsSync(filePath)) {
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Create individual file
      const outputFile = path.join(outputDir, `step-${stepNumber}-${fileName}`);
      fs.writeFileSync(outputFile, sqlContent);
      console.log(`✅ Created: ${outputFile}`);
      
      // Add to combined file
      allSQL += `-- ============================================================================\n`;
      allSQL += `-- STEP ${stepNumber}: ${fileName}\n`;
      allSQL += `-- ============================================================================\n\n`;
      allSQL += sqlContent;
      allSQL += `\n\n`;
      
      stepNumber++;
    } else {
      console.log(`❌ Migration file not found: ${fileName}`);
    }
  }
  
  // Create combined file
  const combinedFile = path.join(outputDir, 'ALL_MIGRATIONS_COMBINED.sql');
  fs.writeFileSync(combinedFile, allSQL);
  console.log(`✅ Created combined file: ${combinedFile}`);
  
  return outputDir;
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  
  try {
    // Test basic connection by trying to query a table
    const response = await fetch(`${SUPABASE_URL}/rest/v1/patients?select=*&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Database connection successful');
      console.log('✅ Patients table exists and is accessible');
      return true;
    } else if (response.status === 404) {
      console.log('❌ Patients table does not exist');
      return false;
    } else {
      console.log(`⚠️  Connection test returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function createSetupInstructions() {
  const instructions = `
# 🚀 Skin Track Aid Database Setup Instructions

## Quick Setup (Recommended)

### Option 1: One-Click Setup
1. Go to: https://supabase.com/dashboard
2. Navigate to your project: **dmcuunucjmmofdfvteta**
3. Go to **SQL Editor** in the left sidebar
4. Copy the entire content from: \`migration-output/ALL_MIGRATIONS_COMBINED.sql\`
5. Paste it into the SQL Editor
6. Click **Run**
7. Wait for all migrations to complete

### Option 2: Step-by-Step Setup
If the combined file doesn't work, run each file separately in order:

1. **Step 1**: Copy and run \`migration-output/step-1-00_create_core_schema.sql\`
2. **Step 2**: Copy and run \`migration-output/step-2-01_cleanup_and_recreate.sql\`
3. **Step 3**: Copy and run \`migration-output/step-3-02_insert_default_data.sql\`
4. **Step 4**: Copy and run \`migration-output/step-4-03_verify_setup.sql\`

## After Setup

1. **Test the application**: Go to http://localhost:8080/
2. **Navigate to Debug tab**: Check database connection status
3. **Create a super admin**: Run this SQL in Supabase:
   \`\`\`sql
   SELECT make_super_admin('your-email@example.com');
   \`\`\`

## Troubleshooting

- If you get permission errors, make sure you're logged into the correct Supabase project
- If tables already exist, the migrations will handle conflicts gracefully
- Check the browser console for any JavaScript errors

## Your App URLs

- **Local Development**: http://localhost:8080/
- **Supabase Project**: https://supabase.com/dashboard/project/dmcuunucjmmofdfvteta
- **API Endpoint**: https://dmcuunucjmmofdfvteta.supabase.co

## Database Tables Created

- ✅ patients
- ✅ roles  
- ✅ user_profiles
- ✅ test_sessions
- ✅ enhanced_allergy_tests
- ✅ bookings
- ✅ activity_logs
- ✅ allergen_categories
- ✅ allergens

## Default Roles

- Super Administrator (full access)
- Administrator (admin access)
- Doctor (medical access)
- Technician (lab access)
- Receptionist (basic access)
`;

  const outputDir = path.join(__dirname, '..', 'migration-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(outputDir, 'SETUP_INSTRUCTIONS.md'), instructions);
  console.log('✅ Created setup instructions: migration-output/SETUP_INSTRUCTIONS.md');
}

async function main() {
  console.log('🚀 Skin Track Aid - Automated Database Setup');
  console.log('=' .repeat(60));
  
  // Test current database status
  const isConnected = await testDatabaseConnection();
  
  if (isConnected) {
    console.log('\n🎉 Database is already set up and working!');
    console.log('Your application should be fully functional.');
    return;
  }
  
  console.log('\n📋 Database needs to be set up. Creating migration files...');
  
  // Create migration files
  await createMigrationFiles();
  
  // Create setup instructions
  await createSetupInstructions();
  
  console.log('\n🎉 Setup files created successfully!');
  console.log('\n📁 Check the \'migration-output\' folder for:');
  console.log('   - ALL_MIGRATIONS_COMBINED.sql (recommended)');
  console.log('   - Individual step files');
  console.log('   - SETUP_INSTRUCTIONS.md (detailed guide)');
  console.log('\n🔗 Your app is running at: http://localhost:8080/');
  console.log('\n💡 Pro tip: Open the Debug tab in your app to test the database connection!');
}

// Run the script
main().catch(console.error); 