# Leave Conflict Resolution - Diagnosis Results

## Root Cause
The system is working correctly, but **no suggestions are showing because:**

### Issue 1: No Published Timetables
- **Found:** 0 PUBLISHED timetables
- **Database Status:**
  - DRAFT: 8 timetables
  - APPROVED: 1 timetable
  - PUBLISHED: 0 timetables

The conflict resolver only searches for `status === "PUBLISHED"` timetables. You need to publish at least one timetable first.

### Issue 2: Faculty Has No Classes on That Day
- Even if timetables were published, Ms. Sneha Gupta has **no classes on Friday (April 17, 2026)**
- So there are no conflicts to resolve

## How to Test the System Properly

### Step 1: Publish a Timetable Where Sneha Gupta Teaches
1. Go to Timetables section
2. Select a timetable in APPROVED status (or create one)
3. Ensure it has Sneha Gupta assigned to at least one Friday class
4. **Click "Publish"** to change status from APPROVED → PUBLISHED

### Step 2: Create a Leave Request
1. Go to Leave Requests (as Sneha Gupta or Admin)
2. Create a leave for Friday, April 17, 2026
3. Specify a reason

### Step 3: Approve the Leave (as Coordinator)
1. Coordinator reviews the leave request
2. **Click "Approve"**
3. System will:
   - Convert date (April 17, 2026) → Friday
   - Search all PUBLISHED timetables
   - Find conflicts where Sneha is assigned on Friday
   - Generate suggestions:
     - ✅ Find replacement faculty
     - ✅ Find alternative slots to reschedule
     - ✅ Mark for manual resolution if neither works

### Step 4: See Suggestions in Response
The API response will include `conflictResolution` with all suggestions:
```json
{
  "status": "APPROVED",
  "conflictResolution": {
    "hasConflicts": true,
    "conflictCount": 2,
    "conflicts": [...],
    "resolutions": [...]
  }
}
```

## Current Database State

### Timetables
- **DRAFT (8)**: Not searchable by conflict resolver
- **APPROVED (1)**: Not searchable by conflict resolver
- **PUBLISHED (0)**: **← NEEDED for conflict detection**

### Sneha Gupta's Schedule
- **Friday classes:** None (tested on Apr 17, 2026)
- **Other days:** Unknown

## Quick Debugging Commands

You can use these API endpoints to test:

```bash
# 1. Find Sneha Gupta's ID
GET /api/debug/faculty-by-name/Sneha

# 2. Check all timetables
GET /api/debug/timetables

# 3. Check what day a date is
GET /api/debug/weekday/2026-04-17

# 4. Check Sneha's classes on Friday
GET /api/debug/faculty/:snehaId/classes?day=Friday
```

## Next Steps

**To see the Leave Conflict Resolution system in action:**

1. ✅ **Ensure at least one timetable is PUBLISHED**
2. ✅ **Ensure Sneha Gupta has assigned classes on the leave date**
3. ✅ **Create and approve a leave for that date**
4. ✅ **View the generated suggestions**

The system will then automatically detect conflicts and suggest:
- Faculty replacements
- Alternative scheduling
- Manual resolution options

## Verify Your System is Working

Once you have a published timetable with Sneha's Friday classes:

1. Apply leave for Friday
2. Coordinator approves
3. Check the response for `conflictResolution` object with suggestions

If suggestions still don't appear, check:
- Is the timetable actually PUBLISHED?
- Does Sneha have classes on that day?
- Check backend logs for the `[LeaveConflictResolver]` debug messages
