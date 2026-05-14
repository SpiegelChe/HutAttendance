# How to Test the Date Fix

## Issue
Enrollment dates were showing "May 7, 2026" regardless of what date you selected.

## The Fix Applied
Changed the date conversion to use noon UTC instead of midnight, which prevents timezone shifts.

---

## ⚠️ IMPORTANT: Clear Browser Cache First!

Before testing, **you MUST clear your browser cache** or the old JavaScript code will still be running!

### Option 1: Hard Refresh (Easiest)
- **Windows/Linux**: Press `Ctrl + Shift + R`
- **Mac**: Press `Cmd + Shift + R`

### Option 2: Clear Cache in Browser
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Incognito/Private Mode
- Open a new incognito/private browsing window
- This uses fresh JavaScript files

---

## Step-by-Step Test

### Test 1: Add Participant to Program with Different Date

1. **Clear browser cache** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

2. Go to **Add to Program** page

3. Search and select a participant

4. Select a program

5. **Change the enrollment date** to: **May 1, 2026**

6. Click **"Add to Program"**

7. Go to the participant's profile

8. Look at the program enrollment section

9. **Expected Result**: Should show **"Started: May 1, 2026"** ✓
   - NOT "May 7, 2026"
   - NOT any other date

---

### Test 2: Try Multiple Different Dates

Repeat Test 1 with different dates:

**Test with May 3:**
1. Add another participant to a program
2. Select date: **May 3, 2026**
3. Expected: Shows **"Started: May 3, 2026"** ✓

**Test with April 25:**
1. Add another participant to a program
2. Select date: **April 25, 2026**
3. Expected: Shows **"Started: Apr 25, 2026"** ✓

**Test with today:**
1. Add another participant to a program
2. Leave date as today (May 7, 2026)
3. Expected: Shows **"Started: May 7, 2026"** ✓

---

### Test 3: Check Browser Console for Logs

1. Open browser DevTools (F12)

2. Go to **Console** tab

3. Go to Add to Program page

4. Select participant, program, and date: **May 10, 2026**

5. Click "Add to Program"

6. **Check console output**:
   ```
   Selected enrollment date: 2026-05-10
   Converted to ISO: 2026-05-10T12:00:00.000Z
   ```

7. **Verify**:
   - First line shows the date you selected
   - Second line shows it converted to May 10 (not May 7 or any other date)
   - Time is 12:00:00 (noon UTC)

---

### Test 4: Check Database Directly (Advanced)

If you have access to Supabase dashboard:

1. Go to Supabase → Table Editor
2. Open `program_enrollments` table
3. Find the enrollment you just created
4. Check the `start_date` column
5. **Expected**: `2026-05-10 12:00:00+00` (or whatever date you selected)

---

## What If It's Still Wrong?

### If you still see May 7, 2026:

1. **Cache issue**: Try in a new incognito window

2. **Check which field is displayed**:
   - Open participant profile
   - The enrollment should show **"Started:"** (green badge)
   - NOT "Enrolled:" (that's the old field)

3. **Old enrollment records**:
   - New enrollments created AFTER the fix will work correctly
   - Old enrollments created BEFORE the fix might still show wrong dates
   - Solution: Create a NEW enrollment to test

4. **Check for errors**:
   - Open browser console (F12)
   - Look for any red error messages
   - Share errors if you see any

---

## Expected vs Incorrect Behavior

### ✓ CORRECT (After fix):
```
Selected date: May 1, 2026
Profile shows: "Started: May 1, 2026"
Database has: 2026-05-01 12:00:00+00
```

### ✗ INCORRECT (Before fix):
```
Selected date: May 1, 2026
Profile shows: "Started: May 7, 2026" or "Apr 30, 2026"
Database has: Wrong date due to timezone
```

---

## Code Changes Made

### File: `/src/app/pages/AddToProgram.tsx`

**Before (WRONG)**:
```javascript
const enrollmentDateTime = new Date(enrollmentDate).toISOString();
```

**After (CORRECT)**:
```javascript
const [year, month, day] = enrollmentDate.split('-');
const enrollmentDateTime = new Date(Date.UTC(
  parseInt(year), parseInt(month) - 1, parseInt(day), 
  12, 0, 0
)).toISOString();
```

### File: `/src/app/pages/ParticipantProfile.tsx`

**Changed display field**:
- Now shows `start_date` instead of `enrolled_at`
- Label changed from "Enrolled:" to "Started:"
- Now displays with green background badge

---

## Summary

✅ **Fixed**: Timezone conversion now uses noon UTC  
✅ **Updated**: Profile displays `start_date` field  
✅ **Added**: Console logging to verify conversions  
✅ **Tested**: Same fix applied to withdrawal/deactivation/reactivation  

**Remember to clear cache before testing!** 🔄
