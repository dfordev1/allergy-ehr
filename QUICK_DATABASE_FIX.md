# 🚨 QUICK DATABASE FIX - Missing Tables

## **IMMEDIATE SOLUTION**

Your database tables are missing! Here's how to fix it in 2 minutes:

### **Step 1: Go to Supabase Dashboard**
1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click on your project: `dmcuunucjmmofdfvteta`
3. Click **SQL Editor** in the left sidebar

### **Step 2: Clean Up Old Tables (FIXES THE "user_id" ERROR)**
1. Click **New Query**
2. Copy and paste the ENTIRE content from: `supabase/migrations/01_cleanup_and_recreate.sql`
3. Click **Run** (the play button)

### **Step 3: Create New Tables**
1. Click **New Query** again
2. Copy and paste the ENTIRE content from: `supabase/migrations/00_create_core_schema.sql`
3. Click **Run** (the play button)



### **Step 4: Insert Default Data**
1. Click **New Query** again
2. Copy and paste from: `supabase/migrations/02_insert_default_data.sql`
3. Click **Run**

### **Step 5: Make Yourself Super Admin**
1. Click **New Query** again
2. Run this command (replace with your email):
```sql
SELECT make_super_admin('maajidsb1@gmail.com');
```

## **What This Creates:**

✅ **Core Tables:**
- `patients` - Patient records
- `roles` - User roles (Admin, Doctor, etc.)
- `user_profiles` - Extended user info
- `test_sessions` - Allergy test results
- `enhanced_allergy_tests` - Advanced allergy testing
- `bookings` - Appointment scheduling
- `activity_logs` - Audit trail
- `allergen_categories` - Allergen categories
- `allergens` - 43 predefined allergens

✅ **Indexes & Performance:**
- Fast search on patient names
- Optimized queries for all tables
- Proper foreign key relationships

✅ **Security:**
- Row Level Security (RLS) enabled
- Proper authentication policies
- Audit logging for compliance

## **After Running This:**

1. **Refresh your app** - Tables will be available
2. **Go to Settings** - You'll be a Super Admin
3. **Add patients** - Everything will work
4. **Run allergy tests** - All features available

## **If You Get Errors:**

- **"relation already exists"** - Tables already created, skip to Step 3
- **"permission denied"** - Make sure you're logged into Supabase
- **"function not found"** - Run Step 2 again completely

## **Need Help?**

If you still get errors, check the **Debug** tab in your app for specific error messages.

---

**This will fix your "Database Tables Error" immediately! 🚀** 