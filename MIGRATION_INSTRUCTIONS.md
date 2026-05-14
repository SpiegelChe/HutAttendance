# Step-by-Step Migration Instructions

## Overview
You need to run 6 SQL scripts in your Supabase database to add historical tracking. This guide shows you exactly how to do it.

---

## STEP 1: Access Your Supabase Dashboard

1. **Open your browser** and go to: https://supabase.com/dashboard
2. **Log in** to your Supabase account
3. **Click on your project**: `azeigwdgpgjccryasuky`
4. You should see your project dashboard

---

## STEP 2: Open the SQL Editor

1. **Look at the left sidebar** in your Supabase dashboard
2. **Click on** the icon that looks like `</>` or find the menu item labeled **"SQL Editor"**
3. **Click** the **"New Query"** button (usually green/blue button in the top right)
4. You'll see a blank SQL editor window

---

## STEP 3: Run Migration Step 1 - Update Participants Table

### What to do:

1. **Open the file** `SUPABASE_MIGRATION.md` in your code editor
2. **Scroll down** to the section titled **"Step 1: Update `participants` table"**
3. **Copy this exact SQL code**:

```sql
-- Add activation status columns to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMP WITH TIME ZONE;

-- Set existing participants as active
UPDATE participants 
SET is_active = true 
WHERE is_active IS NULL;
```

4. **Paste it** into the SQL Editor window in Supabase
5. **Click the "Run" button** (usually green, bottom right of the editor)
6. **Wait for success message** - you should see "Success. No rows returned" or similar
7. ✅ **Step 1 Complete!**

---

## STEP 4: Run Migration Step 2 - Update Program Enrollments Table

### What to do:

1. **Clear the SQL Editor** (select all and delete, or click "New Query" again)
2. **Go back to** `SUPABASE_MIGRATION.md`
3. **Scroll to** the section titled **"Step 2: Update `program_enrollments` table"**
4. **Copy this exact SQL code**:

```sql
-- Add enrollment period tracking to program_enrollments table
ALTER TABLE program_enrollments 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;

-- Update existing records to set start_date from enrolled_at
UPDATE program_enrollments 
SET start_date = COALESCE(enrolled_at, created_at, NOW())
WHERE start_date IS NULL;

-- Set existing enrollments as active
UPDATE program_enrollments 
SET is_active = true 
WHERE is_active IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_program_enrollments_active 
ON program_enrollments(is_active);

CREATE INDEX IF NOT EXISTS idx_program_enrollments_dates 
ON program_enrollments(start_date, end_date);
```

5. **Paste it** into the SQL Editor
6. **Click "Run"**
7. **Wait for success message**
8. ✅ **Step 2 Complete!**

---

## STEP 5: Run Migration Step 3 - Create History Table

### What to do:

1. **Clear the SQL Editor** (New Query)
2. **Go back to** `SUPABASE_MIGRATION.md`
3. **Scroll to** the section titled **"Step 3: Create `participation_history` table"**
4. **Copy this exact SQL code**:

```sql
-- Create participation history table
CREATE TABLE IF NOT EXISTS participation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (
    change_type IN (
      'program_enrollment',
      'program_withdrawal',
      'profile_deactivation',
      'profile_reactivation'
    )
  ),
  change_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participation_history_participant 
ON participation_history(participant_id);

CREATE INDEX IF NOT EXISTS idx_participation_history_program 
ON participation_history(program_id);

CREATE INDEX IF NOT EXISTS idx_participation_history_change_date 
ON participation_history(change_date);

CREATE INDEX IF NOT EXISTS idx_participation_history_change_type 
ON participation_history(change_type);
```

5. **Paste it** into the SQL Editor
6. **Click "Run"**
7. **Wait for success message**
8. ✅ **Step 3 Complete!**

---

## STEP 6: Run Migration Step 4 - Enable Security

### What to do:

1. **Clear the SQL Editor** (New Query)
2. **Go back to** `SUPABASE_MIGRATION.md`
3. **Scroll to** the section titled **"Step 4: Enable Row Level Security (RLS)"**
4. **Copy this exact SQL code**:

```sql
-- Enable RLS on participation_history table
ALTER TABLE participation_history ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read history
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read participation history"
ON participation_history
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow system to insert history records
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert participation history"
ON participation_history
FOR INSERT
TO authenticated
WITH CHECK (true);
```

5. **Paste it** into the SQL Editor
6. **Click "Run"**
7. **Wait for success message**
8. ✅ **Step 4 Complete!**

---

## STEP 7: Run Migration Step 5a - Enrollment Trigger

### What to do:

1. **Clear the SQL Editor** (New Query)
2. **Go back to** `SUPABASE_MIGRATION.md`
3. **Scroll to** the section titled **"Step 5: Create triggers"** → subsection **"Trigger for program enrollments"**
4. **Copy this exact SQL code**:

```sql
-- Function to record program enrollment in history
CREATE OR REPLACE FUNCTION record_program_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO participation_history (
    participant_id,
    program_id,
    change_type,
    change_date,
    notes
  ) VALUES (
    NEW.participant_id,
    NEW.program_id,
    'program_enrollment',
    COALESCE(NEW.start_date, NEW.created_at, NOW()),
    'Enrolled in program'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_record_enrollment ON program_enrollments;
CREATE TRIGGER trigger_record_enrollment
AFTER INSERT ON program_enrollments
FOR EACH ROW
EXECUTE FUNCTION record_program_enrollment();
```

5. **Paste it** into the SQL Editor
6. **Click "Run"**
7. **Wait for success message**
8. ✅ **Step 5a Complete!**

---

## STEP 8: Run Migration Step 5b - Withdrawal Trigger

### What to do:

1. **Clear the SQL Editor** (New Query)
2. **Go back to** `SUPABASE_MIGRATION.md`
3. **Scroll to** the section titled **"Trigger for program withdrawals"**
4. **Copy this exact SQL code**:

```sql
-- Function to record program withdrawal in history
CREATE OR REPLACE FUNCTION record_program_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO participation_history (
      participant_id,
      program_id,
      change_type,
      change_date,
      notes
    ) VALUES (
      NEW.participant_id,
      NEW.program_id,
      'program_withdrawal',
      COALESCE(NEW.end_date, NOW()),
      COALESCE(NEW.withdrawal_reason, 'Withdrawn from program')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_record_withdrawal ON program_enrollments;
CREATE TRIGGER trigger_record_withdrawal
AFTER UPDATE ON program_enrollments
FOR EACH ROW
EXECUTE FUNCTION record_program_withdrawal();
```

5. **Paste it** into the SQL Editor
6. **Click "Run"**
7. **Wait for success message**
8. ✅ **Step 5b Complete!**

---

## STEP 9: Run Migration Step 5c - Profile Status Trigger

### What to do:

1. **Clear the SQL Editor** (New Query)
2. **Go back to** `SUPABASE_MIGRATION.md`
3. **Scroll to** the section titled **"Trigger for profile deactivation/reactivation"**
4. **Copy this exact SQL code**:

```sql
-- Function to record profile status changes
CREATE OR REPLACE FUNCTION record_profile_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Profile deactivation
  IF OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO participation_history (
      participant_id,
      change_type,
      change_date,
      notes
    ) VALUES (
      NEW.id,
      'profile_deactivation',
      COALESCE(NEW.deactivated_at, NOW()),
      'Profile deactivated - all programs ended'
    );
    
    -- Also end all active program enrollments
    UPDATE program_enrollments
    SET 
      is_active = false,
      end_date = COALESCE(NEW.deactivated_at, NOW()),
      withdrawal_reason = 'Profile deactivated'
    WHERE participant_id = NEW.id AND is_active = true;
  END IF;
  
  -- Profile reactivation
  IF (OLD.is_active IS NULL OR OLD.is_active = false) AND NEW.is_active = true THEN
    INSERT INTO participation_history (
      participant_id,
      change_type,
      change_date,
      notes
    ) VALUES (
      NEW.id,
      'profile_reactivation',
      COALESCE(NEW.reactivated_at, NOW()),
      'Profile reactivated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_record_profile_status ON participants;
CREATE TRIGGER trigger_record_profile_status
AFTER UPDATE ON participants
FOR EACH ROW
EXECUTE FUNCTION record_profile_status_change();
```

5. **Paste it** into the SQL Editor
6. **Click "Run"**
7. **Wait for success message**
8. ✅ **Step 5c Complete!**

---

## STEP 10: Verify Everything Worked

### What to do:

1. **Clear the SQL Editor** (New Query)
2. **Go back to** `SUPABASE_MIGRATION.md`
3. **Scroll to** the section titled **"Step 6: Verify the migration"**
4. **Copy this exact SQL code**:

```sql
-- Check that new columns exist in participants
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'participants' 
  AND column_name IN ('is_active', 'deactivated_at', 'reactivated_at');

-- Check that new columns exist in program_enrollments
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'program_enrollments' 
  AND column_name IN ('start_date', 'end_date', 'is_active', 'withdrawal_reason');

-- Check that participation_history table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'participation_history';

-- Check that triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name IN (
  'trigger_record_enrollment',
  'trigger_record_withdrawal', 
  'trigger_record_profile_status'
);
```

5. **Paste it** into the SQL Editor
6. **Click "Run"**
7. **You should see results** showing:
   - 3 new columns in `participants` table
   - 4 new columns in `program_enrollments` table
   - The `participation_history` table exists
   - 3 triggers exist

8. ✅ **Verification Complete!**

---

## 🎉 MIGRATION COMPLETE!

If all verification queries returned results, your database is now ready for historical tracking!

### What to do next:

1. **Go back to your application** (The Hut Participation Portal)
2. **Test the features**:
   - Register a new participant
   - Enroll them in a program
   - Click "View History" on their profile
   - Try deactivating and reactivating the profile

### Troubleshooting:

**If you get an error:**
- ❌ **"column already exists"** → Skip that step, it's already done
- ❌ **"table does not exist"** → Make sure you've created all your tables first (participants, programs, program_enrollments)
- ❌ **"permission denied"** → Make sure you're logged in as the project owner
- ❌ **Other errors** → Read the error message carefully and check for typos

**Need help?**
- Check the Supabase logs in the dashboard
- Make sure your tables exist before running migrations
- You can run the verification query at any time to check progress

---

## Quick Summary

You ran **9 SQL scripts** in this order:

1. ✅ Added columns to `participants` table
2. ✅ Added columns to `program_enrollments` table  
3. ✅ Created `participation_history` table
4. ✅ Enabled security (RLS) on history table
5. ✅ Created enrollment trigger (auto-record when participant joins program)
6. ✅ Created withdrawal trigger (auto-record when participant leaves program)
7. ✅ Created profile status trigger (auto-record when profile is activated/deactivated)
8. ✅ Verified everything worked

Now your system automatically tracks:
- When participants join programs (with start date)
- When participants leave programs (with end date and reason)
- When profiles are deactivated (with timestamp)
- When profiles are reactivated (with timestamp)

All of this data is preserved forever for historical reporting! 🎊
