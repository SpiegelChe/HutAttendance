-- ============================================================================
-- VERIFICATION QUERY - Run this AFTER the migration to verify success
-- ============================================================================

-- Check participants table columns
SELECT 'Participants Table Columns' as check_type, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'participants'
  AND column_name IN ('is_active', 'deactivated_at', 'reactivated_at')

UNION ALL

-- Check program_enrollments table columns
SELECT 'Program Enrollments Columns' as check_type, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'program_enrollments'
  AND column_name IN ('start_date', 'end_date', 'is_active', 'withdrawal_reason')

UNION ALL

-- Check participation_history table exists
SELECT 'Tables' as check_type, table_name, 'table' as data_type
FROM information_schema.tables
WHERE table_name = 'participation_history'

UNION ALL

-- Check triggers exist
SELECT 'Triggers' as check_type, trigger_name, event_object_table as data_type
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_record_enrollment',
  'trigger_record_withdrawal',
  'trigger_record_profile_status'
)

ORDER BY check_type, column_name;
