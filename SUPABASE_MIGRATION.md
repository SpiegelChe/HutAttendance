# Supabase Database Migration for Historical Participation Tracking

This document outlines the database schema changes needed to implement historical participation tracking.

## IMPORTANT: Run these migrations in your Supabase SQL Editor

Go to your Supabase Dashboard → SQL Editor → New Query, then copy and paste each section below.

---

## Step 1: Update `participants` table

Add columns to track profile activation status:

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

---

## Step 2: Update `program_enrollments` table

Add columns to track enrollment periods:

```sql
-- Add enrollment period tracking to program_enrollments table
ALTER TABLE program_enrollments 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;

-- Update existing records to set start_date from enrolled_at
UPDATE program_enrollments 
SET start_date = COALESCE(enrolled_at, NOW())
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

---

## Step 3: Create `participation_history` table

Create a new table to track all participation changes:

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

---

## Step 4: Enable Row Level Security (RLS) for participation_history

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

---

## Step 5: Create triggers to automatically record history

### Trigger for program enrollments:

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
    COALESCE(NEW.start_date, NOW()),
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

### Trigger for program withdrawals:

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

### Trigger for profile deactivation/reactivation:

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

---

## Step 6: Verify the migration

Run this query to test that everything is working:

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

---

## Useful Reporting Queries

### Get participant's full history:

```sql
SELECT 
  ph.change_type,
  ph.change_date,
  ph.notes,
  p.name as program_name
FROM participation_history ph
LEFT JOIN programs p ON ph.program_id = p.id
WHERE ph.participant_id = 'PARTICIPANT_UUID'
ORDER BY ph.change_date DESC;
```

### Get participants active during a specific date range:

```sql
SELECT DISTINCT
  part.id,
  part.first_name,
  part.last_name,
  pe.program_id,
  prog.name as program_name,
  pe.start_date,
  pe.end_date
FROM participants part
JOIN program_enrollments pe ON part.id = pe.participant_id
JOIN programs prog ON pe.program_id = prog.id
WHERE 
  pe.start_date <= '2026-12-31'
  AND (pe.end_date IS NULL OR pe.end_date >= '2026-01-01')
ORDER BY part.last_name, part.first_name;
```

### Get attendance records for a participant even if profile is inactive:

```sql
SELECT 
  ar.date,
  ar.status,
  p.name as program_name,
  pe.start_date,
  pe.end_date
FROM attendance_records ar
JOIN programs p ON ar.program_id = p.id
JOIN program_enrollments pe ON ar.program_id = pe.program_id 
  AND ar.participant_id = pe.participant_id
WHERE ar.participant_id = 'PARTICIPANT_UUID'
  AND ar.date BETWEEN pe.start_date AND COALESCE(pe.end_date, CURRENT_DATE)
ORDER BY ar.date DESC;
```

### Count program enrollments by month:

```sql
SELECT 
  DATE_TRUNC('month', start_date) as month,
  COUNT(*) as enrollments
FROM program_enrollments
GROUP BY month
ORDER BY month DESC;
```

### Get retention rate (participants who stayed vs left):

```sql
SELECT 
  prog.name as program_name,
  COUNT(DISTINCT pe.participant_id) as total_participants,
  COUNT(DISTINCT CASE WHEN pe.is_active = true THEN pe.participant_id END) as active_participants,
  COUNT(DISTINCT CASE WHEN pe.is_active = false THEN pe.participant_id END) as withdrawn_participants,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN pe.is_active = true THEN pe.participant_id END) / 
    NULLIF(COUNT(DISTINCT pe.participant_id), 0), 
    2
  ) as retention_percentage
FROM programs prog
LEFT JOIN program_enrollments pe ON prog.id = pe.program_id
GROUP BY prog.name
ORDER BY retention_percentage DESC;
```

---

## Migration Complete!

After running all these SQL statements in your Supabase SQL Editor, your database will be ready for historical participation tracking. The application code is already set up to use these new features.

## What happens now:

✅ **New enrollments** automatically record start dates and create history records  
✅ **Profile deactivations** record timestamps and end all active programs  
✅ **Program withdrawals** record end dates and reasons  
✅ **Profile reactivations** record timestamps and allow new enrollments  
✅ **All historical data** is preserved for accurate reporting  

Test the system by:
1. Creating a new participant
2. Enrolling them in a program
3. Viewing their history
4. Withdrawing them from the program
5. Checking that the history shows all events
