import Timetable from "../models/Timetable.js";
import LeaveRequest from "../models/LeaveRequest.js";
import FacultySubjectAssignment from "../models/FacultySubjectAssignment.js";
import Faculty from "../models/Faculty.js";
import User from "../models/User.js";

/**
 * Convert a date to its weekday name
 */
export const getWeekdayFromDate = (date) => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dateObj = new Date(date);
    const dayIndex = dateObj.getDay();
    return daysOfWeek[dayIndex];
};

/**
 * Find all timetable entries where a faculty is assigned on a specific day
 */
export const findConflictingSlots = async (facultyId, dayName) => {
    const conflictingSlots = [];
    console.log(`[findConflictingSlots] Searching for slots on ${dayName} for faculty ${facultyId}`);

    const timetables = await Timetable.find({ status: { $in: ["APPROVED", "PUBLISHED"] } })
        .populate("schedule.slots.subject")
        .populate("schedule.slots.faculty")
        .populate("schedule.slots.classroom");

    console.log(`[findConflictingSlots] Found ${timetables.length} active timetables (APPROVED/PUBLISHED)`);

    for (const timetable of timetables) {
        const schedule = timetable.schedule.find(s => s.day === dayName);
        if (!schedule) continue;

        const conflicts = schedule.slots.filter(slot => {
            if (!slot.faculty) return false;
            const slotFacultyId = slot.faculty._id ? slot.faculty._id.toString() : slot.faculty.toString();
            const matchesFaculty = slotFacultyId === facultyId.toString();
            const isTeachingClass = slot.type !== "Break" && slot.type !== "Lunch" && slot.type !== "Free";
            return matchesFaculty && isTeachingClass;
        });

        console.log(`[findConflictingSlots] ${timetable.name} on ${dayName}: ${conflicts.length} conflicts found`);

        for (const conflict of conflicts) {
            conflictingSlots.push({
                timetableId: timetable._id,
                timetableName: timetable.name,
                day: dayName,
                time: conflict.time,
                subject: conflict.subject,
                classroom: conflict.classroom,
                type: conflict.type
            });
        }
    }

    console.log(`[findConflictingSlots] Total conflicts found: ${conflictingSlots.length}`);
    return conflictingSlots;
};

/**
 * Find ALL alternative faculty who can teach the same subject at the same slot
 * Returns a ranked list (subject-assigned first, then other available faculty)
 */
export const findAlternativeFaculty = async (subjectId, dayName, timeSlot, excludeFacultyId, leaveDate) => {
    try {
        const alternatives = [];
        const assignedFacultyIds = new Set();

        // Priority 1: Faculty assigned to this subject (only if subjectId is provided)
        if (subjectId) {
            const assignments = await FacultySubjectAssignment.find({
                subject: subjectId,
                status: "ACTIVE"
            }).populate("faculty");

            for (const assignment of assignments) {
                const faculty = assignment.faculty;
                if (!faculty) continue;
                if (faculty._id.toString() === excludeFacultyId.toString()) continue;

                assignedFacultyIds.add(faculty._id.toString());

                // Check unavailable slots
                const isUnavailable = faculty.unavailableSlots?.some(
                    slot => slot.day === dayName && slot.time === timeSlot
                );
                if (isUnavailable) continue;

                // Check if busy in timetable
                const isBusy = await isSlotBusy(faculty._id, dayName, timeSlot);
                if (isBusy) continue;

                // Check if on approved leave that day (date-accurate)
                const isOnLeave = await isFacultyOnLeave(faculty._id, leaveDate);
                if (isOnLeave) continue;

                alternatives.push({
                    id: faculty._id,
                    name: faculty.name,
                    email: faculty.email,
                    designation: faculty.designation || "Faculty",
                    department: faculty.department,
                    isSubjectCompatible: true,
                    priority: 1
                });
            }
        } // end if (subjectId)

        // Priority 2: Any other faculty who is free at that slot
        const allFaculty = await Faculty.find({});
        for (const faculty of allFaculty) {
            if (faculty._id.toString() === excludeFacultyId.toString()) continue;
            if (assignedFacultyIds.has(faculty._id.toString())) continue;

            const isUnavailable = faculty.unavailableSlots?.some(
                slot => slot.day === dayName && slot.time === timeSlot
            );
            if (isUnavailable) continue;

            const isBusy = await isSlotBusy(faculty._id, dayName, timeSlot);
            if (isBusy) continue;

            const isOnLeave = await isFacultyOnLeave(faculty._id, leaveDate);
            if (isOnLeave) continue;

            alternatives.push({
                id: faculty._id,
                name: faculty.name,
                email: faculty.email,
                designation: faculty.designation || "Faculty",
                department: faculty.department,
                isSubjectCompatible: false,
                priority: 2
            });
        }

        // Sort: subject-compatible first, then alphabetically
        alternatives.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));

        return alternatives;
    } catch (error) {
        console.error("Error finding alternative faculty:", error);
        return [];
    }
};

/**
 * Check if a faculty is busy at a specific day and time slot in any timetable
 */
export const isSlotBusy = async (facultyId, dayName, timeSlot) => {
    const timetables = await Timetable.find({ status: { $in: ["APPROVED", "PUBLISHED"] } });

    for (const timetable of timetables) {
        const schedule = timetable.schedule.find(s => s.day === dayName);
        if (!schedule) continue;

        const isBusy = schedule.slots.some(slot =>
            slot.faculty &&
            slot.faculty.toString() === facultyId.toString() &&
            slot.time === timeSlot &&
            slot.type !== "Break" && slot.type !== "Lunch" && slot.type !== "Free"
        );

        if (isBusy) return true;
    }

    return false;
};

/**
 * Check if a faculty (Faculty doc) is on approved leave on a specific date
 * Uses the actual leave date rather than weekday for accuracy
 */
export const isFacultyOnLeave = async (facultyId, leaveDate) => {
    if (!leaveDate) return false;
    const dateToCheck = new Date(leaveDate);
    dateToCheck.setHours(0, 0, 0, 0);
    const dayAfter = new Date(dateToCheck);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Find User with matching Faculty doc via email bridge
    const faculty = await Faculty.findById(facultyId).select("email");
    if (!faculty) return false;
    const user = await User.findOne({ email: faculty.email }).select("_id");
    if (!user) return false;

    const leave = await LeaveRequest.findOne({
        faculty: user._id,
        status: "APPROVED",
        date: { $gte: dateToCheck, $lt: dayAfter }
    });
    return !!leave;
};

/**
 * Find a free time slot in any day of the week for the same timetable
 */
export const findAlternativeSlot = async (timetableId, subjectId, classroomId, slotType) => {
    try {
        const timetable = await Timetable.findById(timetableId)
            .populate("schedule.slots.subject")
            .populate("schedule.slots.classroom");

        if (!timetable) return null;

        const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        for (const day of workingDays) {
            let schedule = timetable.schedule.find(s => s.day === day);
            if (!schedule) continue;

            for (const slot of schedule.slots) {
                if (slot.type === "Free") {
                    return {
                        day: day,
                        time: slot.time,
                        classroom: classroomId
                    };
                }
            }
        }

        return null;
    } catch (error) {
        console.error("Error finding alternative slot:", error);
        return null;
    }
};

/**
 * Generate conflict resolution suggestions for a leave request
 */
export const resolveLeaveConflicts = async (userId, leaveDate) => {
    try {
        const weekday = getWeekdayFromDate(leaveDate);
        console.log(`[LeaveConflictResolver] Processing leave for user ${userId} on ${leaveDate}. Weekday: ${weekday}`);

        // ── CRITICAL: Resolve User → Faculty via shared email ──────────────
        // LeaveRequest.faculty references User._id
        // Timetable.slots.faculty references Faculty._id
        // Bridge: User.email === Faculty.email
        const user = await User.findById(userId).select("email name");
        if (!user) throw new Error(`User ${userId} not found`);

        const facultyDoc = await Faculty.findOne({ email: user.email });
        if (!facultyDoc) {
            console.log(`[LeaveConflictResolver] No Faculty document found for User email: ${user.email}. No timetable conflicts possible.`);
            return { hasConflicts: false, conflicts: [], resolutions: [], note: "No Faculty record linked to this user account" };
        }

        const facultyId = facultyDoc._id;
        console.log(`[LeaveConflictResolver] Mapped User "${user.email}" → Faculty "${facultyDoc.name}" (${facultyId})`);

        const conflictingSlots = await findConflictingSlots(facultyId, weekday);
        console.log(`[LeaveConflictResolver] Found ${conflictingSlots.length} conflicting slots`);

        if (conflictingSlots.length === 0) {
            return {
                hasConflicts: false,
                conflicts: [],
                resolutions: []
            };
        }

        const resolutions = [];

        for (const conflict of conflictingSlots) {
            const resolution = {
                conflict: conflict,
                suggestions: []
            };

            // Suggestion A: Find ALL alternative faculty (returns ranked list)
            // Guard against null subject (e.g. "Free" periods shouldn't reach here, but safety first)
            const subjectId = conflict.subject?._id || conflict.subject || null;
            const alternativeFacultyList = await findAlternativeFaculty(
                subjectId,
                conflict.day,
                conflict.time,
                facultyId,
                leaveDate   // Pass actual date for accurate leave screening
            );

            if (alternativeFacultyList.length > 0) {
                const best = alternativeFacultyList[0];
                resolution.suggestions.push({
                    type: "FACULTY_REPLACEMENT",
                    priority: 1,
                    description: `Replace with ${best.name}${best.isSubjectCompatible ? ' (Subject Compatible)' : ''}`,
                    details: best,
                    allAlternatives: alternativeFacultyList,
                    status: "AVAILABLE"
                });
            }

            // Suggestion B: Find alternative time slot
            const alternativeSlot = await findAlternativeSlot(
                conflict.timetableId,
                subjectId,
                conflict.classroom?._id,
                conflict.type
            );

            if (alternativeSlot) {
                resolution.suggestions.push({
                    type: "SLOT_RESCHEDULING",
                    priority: 2,
                    description: `Reschedule to ${alternativeSlot.day} at ${alternativeSlot.time}`,
                    details: alternativeSlot,
                    status: "AVAILABLE"
                });
            }

            // Suggestion C: Manual resolution fallback
            if (resolution.suggestions.length === 0) {
                resolution.suggestions.push({
                    type: "MANUAL_RESOLUTION",
                    priority: 3,
                    description: "No automatic resolution found. Requires manual handling.",
                    details: {},
                    allAlternatives: [],
                    status: "PENDING_MANUAL_RESOLUTION"
                });
            }

            resolutions.push(resolution);
        }

        return {
            hasConflicts: true,
            conflictCount: conflictingSlots.length,
            weekday: weekday,
            conflicts: conflictingSlots,
            resolutions: resolutions
        };
    } catch (error) {
        console.error("Error resolving leave conflicts:", error);
        throw error;
    }
};

/**
 * Apply a suggested resolution to the timetable
 */
export const applyResolution = async (resolutionType, conflictData, suggestionData) => {
    try {
        const timetable = await Timetable.findById(conflictData.timetableId);
        if (!timetable) return false;

        const schedule = timetable.schedule.find(s => s.day === conflictData.day);
        if (!schedule) return false;

        const slotIndex = schedule.slots.findIndex(s => s.time === conflictData.time);
        if (slotIndex === -1) return false;

        if (resolutionType === "FACULTY_REPLACEMENT") {
            schedule.slots[slotIndex].faculty = suggestionData.id;
        } else if (resolutionType === "SLOT_RESCHEDULING") {
            const newSchedule = timetable.schedule.find(s => s.day === suggestionData.day);
            if (!newSchedule) return false;

            const newSlotIndex = newSchedule.slots.findIndex(s => s.time === suggestionData.time);
            if (newSlotIndex === -1) return false;

            newSchedule.slots[newSlotIndex] = schedule.slots[slotIndex];
            schedule.slots.splice(slotIndex, 1);
        }

        await timetable.save();
        return true;
    } catch (error) {
        console.error("Error applying resolution:", error);
        return false;
    }
};
