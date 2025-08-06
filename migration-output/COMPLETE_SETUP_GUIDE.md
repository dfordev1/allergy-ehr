
# 🚀 Complete Skin Track Aid Database Setup

## Step 1: Fix RLS Policies (REQUIRED)
1. Go to: https://supabase.com/dashboard
2. Navigate to your project: **dmcuunucjmmofdfvteta**
3. Go to **SQL Editor** in the left sidebar
4. Copy and paste the content from: `migration-output/FIX_RLS_POLICIES.sql`
5. Click **Run**
6. Wait for the policies to be updated

## Step 2: Insert Default Data
After fixing RLS policies, run this command in your terminal:
```bash
node scripts/insert-default-data.js
```

## Step 3: Verify Setup
Run this command to verify everything is working:
```bash
node scripts/verify-database.js
```

## Alternative: Manual Setup
If the automated scripts don't work, manually run these SQL files in order:

1. **Fix RLS**: `migration-output/FIX_RLS_POLICIES.sql`
2. **Core Schema**: `migration-output/step-1-00_create_core_schema.sql`
3. **Cleanup**: `migration-output/step-2-01_cleanup_and_recreate.sql`
4. **Default Data**: `migration-output/step-3-02_insert_default_data.sql`
5. **Verify**: `migration-output/step-4-03_verify_setup.sql`

## Your App URLs
- **Local Development**: http://localhost:8080/
- **Supabase Project**: https://supabase.com/dashboard/project/dmcuunucjmmofdfvteta

## Troubleshooting
- If you get RLS errors, make sure you ran the FIX_RLS_POLICIES.sql first
- If tables are empty, run the insert-default-data.js script
- Check the Debug tab in your app for real-time database status
