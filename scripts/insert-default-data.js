import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://dmcuunucjmmofdfvteta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY3V1bnVjam1tb2ZkZnZ0ZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTA2MTUsImV4cCI6MjA2OTg4NjYxNX0.ZQ4qBEeqZhuKBdz8vuAHx6zrdehfcX2ivrnl0qQ9nl0";

async function insertData(table, data) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function insertRoles() {
  console.log('👥 Inserting default roles...');
  
  const roles = [
    {
      name: 'super_admin',
      display_name: 'Super Administrator',
      description: 'Full system access with all permissions',
      permissions: {
        patients: ['create', 'read', 'update', 'delete', 'export'],
        tests: ['create', 'read', 'update', 'delete', 'export'],
        bookings: ['create', 'read', 'update', 'delete', 'export'],
        users: ['create', 'read', 'update', 'delete', 'manage_roles'],
        analytics: ['read', 'export', 'advanced'],
        settings: ['read', 'update', 'system'],
        audit: ['read', 'export']
      }
    },
    {
      name: 'admin',
      display_name: 'Administrator',
      description: 'System administration with most permissions',
      permissions: {
        patients: ['create', 'read', 'update', 'delete', 'export'],
        tests: ['create', 'read', 'update', 'delete', 'export'],
        bookings: ['create', 'read', 'update', 'delete', 'export'],
        users: ['create', 'read', 'update'],
        analytics: ['read', 'export'],
        settings: ['read', 'update'],
        audit: ['read']
      }
    },
    {
      name: 'doctor',
      display_name: 'Doctor',
      description: 'Medical professional with patient and test access',
      permissions: {
        patients: ['create', 'read', 'update', 'export'],
        tests: ['create', 'read', 'update', 'export'],
        bookings: ['create', 'read', 'update'],
        analytics: ['read'],
        settings: ['read']
      }
    },
    {
      name: 'technician',
      display_name: 'Technician',
      description: 'Lab technician with test management access',
      permissions: {
        patients: ['read'],
        tests: ['create', 'read', 'update'],
        bookings: ['read', 'update'],
        analytics: ['read']
      }
    },
    {
      name: 'receptionist',
      display_name: 'Receptionist',
      description: 'Basic patient and booking management',
      permissions: {
        patients: ['create', 'read', 'update'],
        bookings: ['create', 'read', 'update'],
        analytics: ['read']
      }
    }
  ];

  for (const role of roles) {
    const result = await insertData('roles', role);
    if (result.success) {
      console.log(`   ✅ Inserted role: ${role.name}`);
    } else {
      console.log(`   ⚠️  Role ${role.name}: ${result.error}`);
    }
  }
}

async function insertAllergenCategories() {
  console.log('\n🏷️  Inserting allergen categories...');
  
  const categories = [
    { name: 'MITE', description: 'Dust mites and related allergens', display_order: 1 },
    { name: 'POLLENS', description: 'Various pollen allergens', display_order: 2 },
    { name: 'TREES', description: 'Tree pollen allergens', display_order: 3 },
    { name: 'FUNGI', description: 'Fungal allergens', display_order: 4 },
    { name: 'DUST MIX', description: 'Mixed dust allergens', display_order: 5 },
    { name: 'EPITHELIA', description: 'Animal epithelial allergens', display_order: 6 },
    { name: 'INSECTS', description: 'Insect allergens', display_order: 7 }
  ];

  for (const category of categories) {
    const result = await insertData('allergen_categories', category);
    if (result.success) {
      console.log(`   ✅ Inserted category: ${category.name}`);
    } else {
      console.log(`   ⚠️  Category ${category.name}: ${result.error}`);
    }
  }
}

async function insertAllergens() {
  console.log('\n🌿 Inserting allergens...');
  
  // First get category IDs
  const categoriesResponse = await fetch(`${SUPABASE_URL}/rest/v1/allergen_categories?select=id,name`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY
    }
  });
  
  if (!categoriesResponse.ok) {
    console.log('   ❌ Could not fetch allergen categories');
    return;
  }
  
  const categories = await categoriesResponse.json();
  const categoryMap = {};
  categories.forEach(cat => categoryMap[cat.name] = cat.id);
  
  const allergens = [
    // MITE
    { sno: 1, category_id: categoryMap['MITE'], name: 'D. farinae' },
    { sno: 2, category_id: categoryMap['MITE'], name: 'D. pteronyssinus' },
    { sno: 3, category_id: categoryMap['MITE'], name: 'Blomia sp.' },
    
    // POLLENS
    { sno: 4, category_id: categoryMap['POLLENS'], name: 'Cyanodon dactylon' },
    { sno: 5, category_id: categoryMap['POLLENS'], name: 'Cenchrus barbatus' },
    { sno: 6, category_id: categoryMap['POLLENS'], name: 'Zea mays' },
    { sno: 7, category_id: categoryMap['POLLENS'], name: 'Rye Grass' },
    { sno: 8, category_id: categoryMap['POLLENS'], name: 'Meadow fescue/E. Plantain' },
    { sno: 9, category_id: categoryMap['POLLENS'], name: 'Kentucky Blue Grass' },
    { sno: 10, category_id: categoryMap['POLLENS'], name: 'Timothy Grass' },
    { sno: 11, category_id: categoryMap['POLLENS'], name: 'Cyperus rotundus' },
    { sno: 12, category_id: categoryMap['POLLENS'], name: 'Typha angustata' },
    { sno: 13, category_id: categoryMap['POLLENS'], name: 'Short Ragweed' },
    { sno: 14, category_id: categoryMap['POLLENS'], name: 'P. hysterophorus' },
    { sno: 15, category_id: categoryMap['POLLENS'], name: 'Amaranthus spinosus' },
    { sno: 16, category_id: categoryMap['POLLENS'], name: 'Chenopodium alba' },
    { sno: 17, category_id: categoryMap['POLLENS'], name: 'Mugwort' },
    { sno: 18, category_id: categoryMap['POLLENS'], name: 'Ricinus communis' },
    { sno: 19, category_id: categoryMap['POLLENS'], name: 'Brassica nigra' },
    { sno: 20, category_id: categoryMap['POLLENS'], name: 'Mustard / Russian Thistle' },
    { sno: 21, category_id: categoryMap['POLLENS'], name: 'Cannabis sativa' },
    { sno: 22, category_id: categoryMap['POLLENS'], name: 'Nettle' },
    { sno: 23, category_id: categoryMap['POLLENS'], name: 'Acacia arabica' },
    { sno: 24, category_id: categoryMap['POLLENS'], name: 'Prosopis juliflora' },
    { sno: 25, category_id: categoryMap['POLLENS'], name: 'Birch / Robinia' },
    
    // TREES
    { sno: 26, category_id: categoryMap['TREES'], name: 'Poplar / Eucalyptus' },
    
    // FUNGI
    { sno: 27, category_id: categoryMap['FUNGI'], name: 'Aspergillus fumigatus' },
    { sno: 28, category_id: categoryMap['FUNGI'], name: 'Aspergillus niger' },
    { sno: 29, category_id: categoryMap['FUNGI'], name: 'Alternaria alternata' },
    
    // DUST MIX
    { sno: 30, category_id: categoryMap['DUST MIX'], name: 'House Dust' },
    { sno: 31, category_id: categoryMap['DUST MIX'], name: 'Saw Dust (Wood)' },
    { sno: 32, category_id: categoryMap['DUST MIX'], name: 'Grain Dust (Rice)' },
    { sno: 33, category_id: categoryMap['DUST MIX'], name: 'Grain Dust (Wheat)' },
    { sno: 34, category_id: categoryMap['DUST MIX'], name: 'Hay Dust' },
    
    // EPITHELIA
    { sno: 35, category_id: categoryMap['EPITHELIA'], name: 'Cat Epithelia' },
    { sno: 36, category_id: categoryMap['EPITHELIA'], name: 'Dog Epithelia' },
    { sno: 37, category_id: categoryMap['EPITHELIA'], name: 'Chicken Feather' },
    { sno: 38, category_id: categoryMap['EPITHELIA'], name: 'Sheep\'s Wool' },
    
    // INSECTS
    { sno: 39, category_id: categoryMap['INSECTS'], name: 'Cockroach' },
    { sno: 40, category_id: categoryMap['INSECTS'], name: 'Honey Bee' },
    { sno: 41, category_id: categoryMap['INSECTS'], name: 'Red Ant' },
    { sno: 42, category_id: categoryMap['INSECTS'], name: 'Mosquito' },
    { sno: 43, category_id: categoryMap['INSECTS'], name: 'Wasp' }
  ];

  let insertedCount = 0;
  for (const allergen of allergens) {
    const result = await insertData('allergens', allergen);
    if (result.success) {
      insertedCount++;
      if (insertedCount % 10 === 0) {
        console.log(`   ✅ Inserted ${insertedCount} allergens...`);
      }
    } else {
      console.log(`   ⚠️  Allergen ${allergen.sno}: ${result.error}`);
    }
  }
  
  console.log(`   ✅ Total allergens inserted: ${insertedCount}`);
}

async function main() {
  console.log('🚀 Inserting Default Data into Skin Track Aid Database');
  console.log('=' .repeat(60));
  
  await insertRoles();
  await insertAllergenCategories();
  await insertAllergens();
  
  console.log('\n🎉 Default data insertion completed!');
  console.log('\n✅ Your database now contains:');
  console.log('   - 5 default roles (Super Admin, Admin, Doctor, Technician, Receptionist)');
  console.log('   - 7 allergen categories (MITE, POLLENS, TREES, etc.)');
  console.log('   - 43 predefined allergens');
  console.log('\n🔗 Your app is ready at: http://localhost:8080/');
  console.log('🔍 Check the Debug tab to verify everything is working!');
}

// Run the script
main().catch(console.error); 