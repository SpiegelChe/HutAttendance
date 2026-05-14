-- ============================================================================
-- HISTORICAL PARTICIPATION TRACKING - COMPLETE MIGRATION
-- Run this entire script once in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Update participants table
-- ============================================================================

-- Add activation status columns to participants table
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMP WITH TIME ZONE;

-- Set existing participants as active
UPDATE participants
SET is_active = true
WHERE is_active IS NULL;


-- ============================================================================
-- STEP 2: Update program_enrollments table
-- ============================================================================

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


-- ============================================================================
-- STEP 3: Create participation_history table
-- ============================================================================

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


-- ============================================================================
-- STEP 4: Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on participation_history table
ALTER TABLE participation_history ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read history
DROP POLICY IF EXISTS "Allow authenticated users to read participation history" ON participation_history;
CREATE POLICY "Allow authenticated users to read participation history"
ON participation_history
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow system to insert history records
DROP POLICY IF EXISTS "Allow authenticated users to insert participation history" ON participation_history;
CREATE POLICY "Allow authenticated users to insert participation history"
ON participation_history
FOR INSERT
TO authenticated
WITH CHECK (true);


-- ============================================================================
-- STEP 5: Create trigger functions and triggers
-- ============================================================================

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

-- Create trigger for enrollments
DROP TRIGGER IF EXISTS trigger_record_enrollment ON program_enrollments;
CREATE TRIGGER trigger_record_enrollment
AFTER INSERT ON program_enrollments
FOR EACH ROW
EXECUTE FUNCTION record_program_enrollment();


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

-- Create trigger for withdrawals
DROP TRIGGER IF EXISTS trigger_record_withdrawal ON program_enrollments;
CREATE TRIGGER trigger_record_withdrawal
AFTER UPDATE ON program_enrollments
FOR EACH ROW
EXECUTE FUNCTION record_program_withdrawal();


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

-- Create trigger for profile status changes
DROP TRIGGER IF EXISTS trigger_record_profile_status ON participants;
CREATE TRIGGER trigger_record_profile_status
AFTER UPDATE ON participants
FOR EACH ROW
EXECUTE FUNCTION record_profile_status_change();


-- ============================================================================
-- VERIFICATION - Check that everything was created successfully
-- ============================================================================

-- Check participants table columns
DO $$
BEGIN
  RAISE NOTICE '=== Checking participants table columns ===';
END $$;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'participants'
  AND column_name IN ('is_active', 'deactivated_at', 'reactivated_at');

-- Check program_enrollments table columns
DO $$
BEGIN
  RAISE NOTICE '=== Checking program_enrollments table columns ===';
END $$;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'program_enrollments'
  AND column_name IN ('start_date', 'end_date', 'is_active', 'withdrawal_reason');

-- Check participation_history table exists
DO $$
BEGIN
  RAISE NOTICE '=== Checking participation_history table ===';
END $$;

SELECT table_name
FROM information_schema.tables
WHERE table_name = 'participation_history';

-- Check triggers exist
DO $$
BEGIN
  RAISE NOTICE '=== Checking triggers ===';
END $$;

SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_record_enrollment',
  'trigger_record_withdrawal',
  'trigger_record_profile_status'
);


-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Historical participation tracking is now enabled.';
  RAISE NOTICE 'Your application will now automatically track:';
  RAISE NOTICE '  ✓ Program enrollments (with start dates)';
  RAISE NOTICE '  ✓ Program withdrawals (with end dates)';
  RAISE NOTICE '  ✓ Profile deactivations (with timestamps)';
  RAISE NOTICE '  ✓ Profile reactivations (with timestamps)';
  RAISE NOTICE '';
  RAISE NOTICE 'Check the query results above to verify all';
  RAISE NOTICE 'tables, columns, and triggers were created.';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test the system in your application!';
  RAISE NOTICE '========================================';
END $$;
