# Quick Start - Run Migration in One Step

## Simple 4-Step Process

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Click on your project: **azeigwdgpgjccryasuky**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

### Step 2: Copy and Paste the Migration
1. Open the file **`MIGRATION_SIMPLE.sql`** in your code editor
2. **Select All** (Ctrl+A or Cmd+A)
3. **Copy** (Ctrl+C or Cmd+C)
4. **Paste** into the Supabase SQL Editor (Ctrl+V or Cmd+V)

### Step 3: Run the Migration
1. Click the **Run** button (green/blue button, bottom right)
2. Wait for completion (should take 5-10 seconds)
3. You should see "Success" message ✅

### Step 4: Verify (Optional but Recommended)
1. Click **New Query** to clear the editor
2. Open the file **`VERIFY_MIGRATION.sql`** in your code editor
3. Copy all content and paste into Supabase SQL Editor
4. Click **Run**
5. You should see a table showing all the new columns, tables, and triggers

## What You Should See After Verification

The verification query will show you:

**Participants columns:**
- `is_active` (boolean)
- `deactivated_at` (timestamp with time zone)
- `reactivated_at` (timestamp with time zone)

**Program enrollments columns:**
- `start_date` (timestamp with time zone)
- `end_date` (timestamp with time zone)
- `is_active` (boolean)
- `withdrawal_reason` (text)

**Tables:**
- `participation_history` (table)

**Triggers:**
- `trigger_record_enrollment` (program_enrollments)
- `trigger_record_withdrawal` (program_enrollments)
- `trigger_record_profile_status` (participants)

## If You Get Errors

**"column already exists"** or **"table already exists"**
- ✅ This is fine! It means that part is already done
- The script will continue and complete the rest

**"table does not exist"** (participants, programs, or program_enrollments)
- ❌ Make sure you have created your base tables first
- You need these tables before running the migration

**"permission denied"**
- ❌ Make sure you're logged in as the project owner

## Test It Out!

Once the migration is complete:

1. **Go to your application**
2. **Register a new participant** or view an existing one
3. **Click "View History"** button on a participant profile
4. **Try enrolling/withdrawing from programs**
5. **Check the history updates automatically!**

## That's It!

Your historical participation tracking is now live! 🎉

All participant activities will now be tracked with timestamps, and you can generate reports for any time period.

## Files Reference

- **`MIGRATION_SIMPLE.sql`** ⭐ Main migration script (run this first)
- **`VERIFY_MIGRATION.sql`** ✓ Verification query (run this after to confirm)
- `MIGRATION_ALL_IN_ONE.sql` - Old version (don't use)
- `SUPABASE_MIGRATION.md` - Detailed documentation
