# Leave Conflict Resolution System

## Overview

This system automatically detects and suggests resolutions for timetable conflicts when a faculty member's leave request is approved. It handles three scenarios:

1. **Faculty Replacement**: Find another faculty who can teach the same subject at the same time
2. **Slot Rescheduling**: Find a free slot in the week to reschedule the class
3. **Manual Resolution**: When neither option is available, flag for manual handling

## System Components

### 1. Service Layer: `leaveConflictResolver.js`

Core functions for conflict detection and resolution:

#### `getWeekdayFromDate(date)`
Converts a leave date to its corresponding weekday (Monday-Saturday).

```javascript
const weekday = getWeekdayFromDate(new Date("2025-04-15"));
// Returns: "Tuesday"
```

#### `findConflictingSlots(facultyId, dayName)`
Finds all timetable entries where a faculty is assigned on a specific day.

```javascript
const slots = await findConflictingSlots(facultyId, "Monday");
// Returns array of conflicting slots with subject, classroom, time details
```

#### `findAlternativeFaculty(subjectId, dayName, timeSlot, excludeFacultyId)`
Finds another faculty who:
- Teaches the same subject
- Is not unavailable at that time
- Is not already teaching at that time slot

```javascript
const alternative = await findAlternativeFaculty(subjectId, "Monday", "10:00-11:00", facultyId);
// Returns faculty details or null
```

#### `findAlternativeSlot(timetableId, subjectId, classroomId, slotType)`
Searches for a free time slot in any day of the week for rescheduling.

```javascript
const slot = await findAlternativeSlot(timetableId, subjectId, classroomId, "Lecture");
// Returns: { day: "Wednesday", time: "14:00-15:00", classroom: classroomId }
```

#### `resolveLeaveConflicts(facultyId, leaveDate)`
Main function that orchestrates the entire conflict resolution process.

```javascript
const result = await resolveLeaveConflicts(facultyId, leaveDate);
// Returns:
// {
//   hasConflicts: boolean,
//   conflictCount: number,
//   weekday: string,
//   conflicts: [...],
//   resolutions: [...]
// }
```

#### `applyResolution(resolutionType, conflictData, suggestionData)`
Applies a suggested resolution to the timetable (faculty replacement or slot rescheduling).

```javascript
const success = await applyResolution(
  "FACULTY_REPLACEMENT",
  conflictData,
  { id: alternativeFacultyId }
);
```

### 2. Model: LeaveRequest

Updated schema with conflict resolution data:

```javascript
conflictResolution: {
  hasConflicts: Boolean,
  conflictCount: Number,
  weekday: String,
  conflicts: [{
    timetableId: ObjectId,
    timetableName: String,
    day: String,
    time: String,
    subject: ObjectId (ref: Subject),
    classroom: ObjectId (ref: Classroom),
    type: String // "Lecture" or "Lab"
  }],
  resolutions: [{
    conflict: { /* same as above */ },
    suggestions: [{
      type: String, // "FACULTY_REPLACEMENT" | "SLOT_RESCHEDULING" | "MANUAL_RESOLUTION"
      priority: Number, // 1 (best) to 3 (needs manual)
      description: String,
      details: Object,
      status: String, // "AVAILABLE" | "APPLIED" | "PENDING_MANUAL_RESOLUTION"
      appliedAt: Date
    }],
    resolvedSuggestionIndex: Number
  }]
}
```

### 3. Controller: leave.controller.js

#### `updateLeaveStatus(req, res)`
Enhanced to automatically resolve conflicts when approving a leave.

**Request:**
```javascript
PATCH /leave/:id/status
{
  status: "APPROVED",
  applySuggestions: [ // Optional - automatically apply specific suggestions
    {
      resolutionIndex: 0,
      suggestionIndex: 0,
      resolutionType: "FACULTY_REPLACEMENT",
      conflictData: { /* conflict details */ },
      suggestionData: { id: alternativeFacultyId }
    }
  ]
}
```

**Response:**
```javascript
{
  message: "Leave approved successfully",
  data: { /* leave request with conflictResolution */ },
  conflicts: { /* conflict details */ }
}
```

#### `getLeaveWithConflicts(req, res)`
Retrieves a leave request with fully populated conflict and suggestion details.

**Request:**
```javascript
GET /leave/:id/conflicts
```

**Response:**
```javascript
{
  _id: "...",
  faculty: { /* populated faculty */ },
  date: "2025-04-15",
  status: "APPROVED",
  conflictResolution: { /* detailed conflict data */ }
}
```

#### `applyConflictSuggestion(req, res)`
Applies a specific suggestion to resolve a conflict after the leave is approved.

**Request:**
```javascript
POST /leave/:id/apply-suggestion
{
  leaveId: "...",
  resolutionIndex: 0,
  suggestionIndex: 0
}
```

**Response:**
```javascript
{
  message: "Conflict suggestion applied successfully",
  data: { /* resolution with updated status */ }
}
```

### 4. Routes: leave.routes.js

New endpoints:

```javascript
GET /leave/:id/conflicts
// Get leave with full conflict details
// Coordinator only

PATCH /leave/:id/status
// Approve/Reject leave with optional automatic suggestion application
// Coordinator only

POST /leave/:id/apply-suggestion
// Apply a specific suggestion to resolve a conflict
// Coordinator only
```

## Workflow

### Step 1: Faculty Submits Leave Request
```javascript
POST /leave
{
  date: "2025-04-15",
  reason: "Medical appointment"
}
```

Status: **PENDING**

### Step 2: Coordinator Reviews and Approves
```javascript
PATCH /leave/:id/status
{
  status: "APPROVED"
}
```

**During this step:**
1. System converts leave date to weekday (e.g., 2025-04-15 → Tuesday)
2. Finds all timetable entries where faculty is assigned on Tuesday
3. For each conflicting slot, generates suggestions

**Response includes:**
```javascript
{
  conflicts: [
    {
      timetableId: "...",
      timetableName: "CSE - Sem 3 - Group 1",
      day: "Tuesday",
      time: "10:00-11:00",
      subject: { name: "Data Structures" },
      classroom: { name: "Lab 301" },
      type: "Lecture"
    }
  ],
  resolutions: [
    {
      conflict: { /* same as above */ },
      suggestions: [
        {
          type: "FACULTY_REPLACEMENT",
          priority: 1,
          description: "Replace with Dr. [Name]",
          details: { id: "...", name: "Dr. [Name]", ... },
          status: "AVAILABLE"
        },
        {
          type: "SLOT_RESCHEDULING",
          priority: 2,
          description: "Reschedule to Wednesday at 14:00-15:00",
          status: "AVAILABLE"
        }
      ]
    }
  ]
}
```

Status: **APPROVED**

### Step 3: Coordinator Views Conflicts and Suggestions
```javascript
GET /leave/:id/conflicts
```

Returns leave with all populated conflict details for display in UI.

### Step 4: Coordinator Applies Suggestions (Optional)

**Option A: Automatic Application During Approval**
```javascript
PATCH /leave/:id/status
{
  status: "APPROVED",
  applySuggestions: [
    {
      resolutionIndex: 0,
      suggestionIndex: 0,
      resolutionType: "FACULTY_REPLACEMENT",
      conflictData: { /* conflict */ },
      suggestionData: { id: alternativeFacultyId }
    }
  ]
}
```

**Option B: Manual Application After Approval**
```javascript
POST /leave/:id/apply-suggestion
{
  leaveId: "...",
  resolutionIndex: 0,
  suggestionIndex: 0
}
```

## Example Scenarios

### Scenario 1: Faculty Replacement Available
```
Leave Date: Monday, April 14
Faculty: Prof. A teaches Data Structures 10:00-11:00 on Monday

Resolution:
- Prof. B also teaches Data Structures and is free at 10:00-11:00
- Suggestion: Replace Prof. A with Prof. B
- Coordinator applies: Timetable updated, Prof. B now teaches Data Structures
```

### Scenario 2: Reschedule to Alternative Slot
```
Leave Date: Wednesday, April 16
Faculty: Prof. C teaches Algorithms 14:00-15:00 on Wednesday
Problem: No other faculty teaches Algorithms

Resolution:
- Free slot found: Thursday 16:00-17:00
- Suggestion: Reschedule class to Thursday 16:00-17:00
- Coordinator applies: Class moved to Thursday
```

### Scenario 3: Manual Resolution Required
```
Leave Date: Friday, April 18
Faculty: Prof. D teaches a specialized Lab 09:00-11:00 on Friday
Problem:
- Only Prof. D teaches this specialized subject
- No free slots available in the week

Resolution:
- Status: PENDING_MANUAL_RESOLUTION
- Suggestion: Manual handling required
- Coordinator must decide (e.g., cancel class, online session, etc.)
```

## Integration with Frontend

### Display Leave Requests with Conflicts
Frontend should show:
1. Leave details
2. Conflict count
3. For each conflict:
   - Class name, time, subject, classroom
   - Available suggestions with descriptions
   - Apply/Cancel buttons for each suggestion

### Example UI Flow
```
Leave Request: Prof. A | Monday, April 14 | [Status: APPROVED]

⚠️  2 Conflicts found

Conflict 1: Data Structures - 10:00-11:00
  Suggestion 1: Replace with Prof. B [Apply] [Choose]
  Suggestion 2: Reschedule to Wednesday 14:00 [Apply]
  Suggestion 3: Manual Resolution

Conflict 2: Database - 14:00-15:00
  Suggestion 1: Replace with Prof. C [Apply]
```

## Error Handling

The system gracefully handles failures:

```javascript
// If conflict resolution fails
{
  status: "APPROVED",
  conflictResolution: {
    hasConflicts: false,
    conflicts: [],
    resolutions: [],
    error: "Failed to fetch timetables"
  }
}
// Leave is still approved, but conflict resolution is attempted next time
```

## Database Indexes

Consider adding these indexes for performance:

```javascript
// LeaveRequest
db.leaverequests.createIndex({ faculty: 1, date: 1 });
db.leaverequests.createIndex({ department: 1, status: 1 });

// FacultySubjectAssignment
db.facultysubjectassignments.createIndex({ subject: 1, status: 1 });
db.facultysubjectassignments.createIndex({ faculty: 1, status: 1 });

// Timetable
db.timetables.createIndex({ status: 1 });
```

## Performance Considerations

1. **Conflict Resolution Timing**: This operation runs synchronously during leave approval. For departments with many timetables, consider:
   - Running as a background job
   - Caching faculty/subject relationships
   - Limiting search to the current academic calendar

2. **Alternative Faculty Search**: Currently searches through all active assignments. Optimize by:
   - Indexing faculty by subject
   - Caching faculty availability
   - Pre-computing faculty capabilities

3. **Timetable Search**: Searches all published timetables. Optimize by:
   - Filtering by department and academic calendar
   - Caching active timetables
   - Using pagination for large datasets

## Future Enhancements

1. **Smart Suggestions**: Weight suggestions by:
   - Faculty experience level
   - Preferred subjects
   - Previous substitution history

2. **Bulk Operations**: Apply suggestions across multiple conflicts with one action

3. **Notifications**: Notify affected facultyand students when replacements/rescheduling occur

4. **Approval Pipeline**: Allow HOD approval before coordinator sees suggestions

5. **Historical Tracking**: Log all conflict resolutions and suggestions for analytics

6. **Constraint Validation**: Check faculty hour limits before suggesting replacement

## Testing

Example test cases:

```javascript
// Test 1: Leave with no conflicts
POST /leave with facultyId on a day with no classes

// Test 2: Leave with replacement available
POST /leave with facultyId on a day with classes
Verify: FACULTY_REPLACEMENT suggestion generated

// Test 3: Leave with rescheduling needed
POST /leave where no replacement faculty available
Verify: SLOT_RESCHEDULING suggestion generated

// Test 4: Leave with manual resolution
POST /leave where no replacement and no free slots
Verify: MANUAL_RESOLUTION suggestion generated

// Test 5: Apply suggestion
PATCH /leave/:id with applySuggestions
Verify: Timetable updated correctly
```
