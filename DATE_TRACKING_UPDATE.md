# Date Input for Historical Tracking - Implementation Summary

## Overview
Staff can now input the actual date when participation events occurred, instead of always using today's date. This allows for:
- Entering historical/backdated records
- Accurately tracking when events actually happened
- Better data integrity for reporting

## What's Been Added

### 1. Add to Program - Enrollment Date Picker
**Location**: Add to Program page

**What changed:**
- Added date picker for enrollment start date
- Defaults to today's date
- Cannot select future dates
- Staff can backdate enrollments

**How it works:**
```
1. Search for participant
2. Select program
3. Choose enrollment date (when they actually joined)
4. Click "Add to Program"
5. System records the exact date entered
```

**Example use case:**
> "Sarah joined the Walking Group on March 15th, but we're entering it today (May 6th). We can select March 15th as the enrollment date."

---

### 2. Program Withdrawal - Withdrawal Date Picker
**Location**: Participant Profile → Unenroll from Program modal

**What changed:**
- Added date picker in the unenrollment confirmation modal
- Defaults to today's date
- Cannot select future dates
- Records when participant actually left the program

**How it works:**
```
1. View participant profile
2. Expand program details
3. Click "Unenroll from Program"
4. Modal appears with date picker
5. Select withdrawal date (when they actually left)
6. Click "Unenroll"
7. System records end_date with the selected date
```

**Example use case:**
> "John stopped attending Chi Kung on April 20th, but we're just now updating his record. We can select April 20th as the withdrawal date."

---

### 3. Profile Deactivation - Deactivation Date Picker
**Location**: Participant Profile → Inactive Profile modal

**What changed:**
- Added date picker in the deactivation confirmation modal
- Defaults to today's date
- Cannot select future dates
- Records when profile became inactive

**How it works:**
```
1. View participant profile
2. Click "Inactive Profile" button
3. Modal shows all programs participant will be withdrawn from
4. Select deactivation date (when they stopped participating)
5. Click "Make Inactive"
6. System:
   - Marks profile as inactive
   - Ends all active program enrollments
   - Records deactivation date
```

**Example use case:**
> "Maria moved away on May 1st and stopped all programs. We're updating her profile today, but can select May 1st as the deactivation date."

---

### 4. Profile Reactivation - Reactivation Date Picker
**Location**: Participant Profile → Reactivate Profile modal

**What changed:**
- Added reactivation confirmation modal with date picker
- Appears when clicking "Reactivate Profile - Add to Program" for inactive profiles
- Defaults to today's date
- Cannot select future dates
- Records when profile was reactivated

**How it works:**
```
1. View inactive participant profile
2. Click "Reactivate Profile - Add to Program"
3. Modal appears with date picker
4. Select reactivation date (when they returned)
5. Click "Reactivate"
6. System:
   - Marks profile as active
   - Records reactivation date
   - Navigates to Add to Program page
7. Add them to programs with enrollment dates
```

**Example use case:**
> "Tom came back from vacation and wants to rejoin on May 10th. We can select May 10th as the reactivation date."

---

## Technical Details

### Database Fields Used

**program_enrollments table:**
- `start_date` - When participant joined the program (from date picker)
- `end_date` - When participant left the program (from date picker)
- `is_active` - Whether enrollment is currently active
- `withdrawal_reason` - Why they left

**participants table:**
- `is_active` - Whether profile is currently active
- `deactivated_at` - When profile was deactivated (from date picker)
- `reactivated_at` - When profile was reactivated (from date picker)

**participation_history table:**
- Automatically populated by database triggers
- Uses the dates entered by staff
- Preserves complete audit trail

### Date Format
- All dates are converted to ISO 8601 format with timestamp
- Example: `2026-05-06` → `2026-05-06T00:00:00.000Z`
- Stored in database as TIMESTAMP WITH TIME ZONE

### Validation
- All date pickers prevent future dates (`max={today}`)
- Empty dates are not allowed - will show error
- Dates are required before action can complete

---

## User Interface

### Date Picker Style
- Large, accessible inputs (text-lg, px-4 py-3)
- Clear labels ("Enrollment Date", "Withdrawal Date", etc.)
- Helper text below each picker
- Native browser date picker (different appearance per browser)
- Focus states with colored borders

### Default Values
- All date pickers default to today's date
- After completing an action, date resets to today
- Prevents accidentally using old dates

---

## Reporting Benefits

With accurate dates, you can now:

### 1. Historical Enrollment Reports
```sql
-- Who was enrolled in March 2026?
SELECT * FROM program_enrollments
WHERE start_date >= '2026-03-01'
  AND start_date <= '2026-03-31';
```

### 2. Program Duration Analysis
```sql
-- How long do participants typically stay?
SELECT 
  program_id,
  AVG(end_date - start_date) as avg_duration
FROM program_enrollments
WHERE is_active = false
GROUP BY program_id;
```

### 3. Active Participants on Specific Date
```sql
-- Who was active on April 15, 2026?
SELECT * FROM program_enrollments
WHERE start_date <= '2026-04-15'
  AND (end_date IS NULL OR end_date >= '2026-04-15');
```

### 4. Retention by Month
```sql
-- Enrollments vs Withdrawals per month
SELECT 
  DATE_TRUNC('month', start_date) as month,
  COUNT(*) as enrollments
FROM program_enrollments
GROUP BY month;
```

---

## Important Notes

### For Staff
1. **Always use the actual date** when you know it
2. **If uncertain**, use today's date
3. **Cannot select future dates** - system prevents this
4. **Dates cannot be changed** after submission - be careful!
5. **Historical data is preserved** - you can always view what happened when

### For Administrators
1. Date pickers appear in all modals that record participation changes
2. Validation prevents future dates but allows backdating
3. All dates flow through to participation_history table via triggers
4. Reports can now accurately show participation for any time period
5. Consider training staff on importance of accurate date entry

---

## Testing Checklist

After running the migration, test these scenarios:

- [ ] Enroll participant with today's date
- [ ] Enroll participant with past date (e.g., last week)
- [ ] Try to enroll with future date (should not be possible)
- [ ] Withdraw participant with today's date
- [ ] Withdraw participant with past date
- [ ] Deactivate profile with specific date
- [ ] Reactivate profile with specific date
- [ ] View participation history - confirm dates are recorded correctly
- [ ] Run a report for a specific date range
- [ ] Verify attendance records still link correctly

---

## Migration Status

✅ **Code Changes Complete**
- AddToProgram.tsx - enrollment date picker added
- ParticipantProfile.tsx - withdrawal, deactivation, reactivation date pickers added
- All handlers updated to use selected dates
- All modals updated with date picker UI

⚠️ **Database Migration Required**
- Run `MIGRATION_SIMPLE.sql` to add database fields
- This enables historical tracking with proper date fields

📊 **Ready for Use**
- Once migration is run, all features are immediately available
- Staff can start entering accurate dates
- Historical reporting becomes possible

---

## Summary

Staff can now record the actual dates when:
1. ✅ Participants **join** programs (enrollment date)
2. ✅ Participants **leave** programs (withdrawal date)
3. ✅ Profiles become **inactive** (deactivation date)
4. ✅ Profiles become **active again** (reactivation date)

This provides accurate historical tracking and enables meaningful reporting across any time period!
