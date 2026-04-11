import Timetable from "../models/Timetable.js";
import LeaveRequest from "../models/LeaveRequest.js";
import FacultySubjectAssignment from "../models/FacultySubjectAssignment.js";
import Faculty from "../models/Faculty.js";

/**
 * Convert a date to its weekday name
 * @param {Date} date
 * @returns {String} Weekday name (Monday-Saturday)
 */
export const getWeekdayFromDate = (date) => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dateObj = new Date(date);
    const dayIndex = dateObj.getDay();
    const weekday = daysOfWeek[dayIndex];
    console.log(`[getWeekdayFromDate] Date: ${date}, Parsed Date: ${dateObj.toISOString()}, Day Index: ${dayIndex}, Weekday: ${weekday}`);
    return weekday;
};

/**
 * Find all timetable entries where a faculty is assigned on a specific day
 * @param {String} facultyId
 * @param {String} dayName - e.g., "Monday"
 * @returns {Array} Array of timetable entries with conflicting slots
 */
export const findConflictingSlots = async (facultyId, dayName) => {
    const conflictingSlots = [];
    console.log(`[findConflictingSlots] Searching for slots on ${dayName} for faculty ${facultyId}`);

    const timetables = await Timetable.find({ status: "PUBLISHED" })
        .populate("schedule.slots.subject")
        .populate("schedule.slots.faculty")
        .populate("schedule.slots.classroom");

    console.log(`[findConflictingSlots] Found ${timetables.length} published timetables`);

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
 * Find an alternative faculty who can teach the same subject at the same slot
 * @param {String} subjectId
 * @param {String} dayName
 * @param {String} timeSlot
 * @param {String} excludeFacultyId - Faculty to exclude (the one on leave)
 * @returns {Object|null} Alternative faculty or null
 */
export const findAlternativeFaculty = async (subjectId, dayName, timeSlot, excludeFacultyId) => {
    try {
        // Find all faculties who teach this subject
        const assignments = await FacultySubjectAssignment.find({
            subject: subjectId,
            status: "ACTIVE"
        }).populate("faculty");

        for (const assignment of assignments) {
            const faculty = assignment.faculty;

            // Skip if it's the faculty on leave
            if (faculty._id.toString() === excludeFacultyId) continue;

            // Check if this faculty's unavailable slots don't conflict
            const isUnavailable = faculty.unavailableSlots.some(
                slot => slot.day === dayName && slot.time === timeSlot
            );
            if (isUnavailable) continue;

            // Check if this faculty is teaching at the same time slot on the same day
            const isBusy = await isSlotBusy(faculty._id, dayName, timeSlot);
            if (!isBusy) {
                return {
                    id: faculty._id,
                    name: faculty.name,
                    email: faculty.email,
                    designation: faculty.designation
                };
            }
        }

        return null;
    } catch (error) {
        console.error("Error finding alternative faculty:", error);
        return null;
    }
};

/**
 * Check if a faculty is busy at a specific day and time slot
 * @param {String} facultyId
 * @param {String} dayName
 * @param {String} timeSlot
 * @returns {Boolean}
 */
export const isSlotBusy = async (facultyId, dayName, timeSlot) => {
    const timetables = await Timetable.find({ status: "PUBLISHED" });

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
 * Find a free time slot in any day of the week for the same timetable
 * @param {String} timetableId
 * @param {String} subjectId
 * @param {String} classroomId
 * @param {String} slotType - "Lecture" or "Lab"
 * @returns {Object|null} Alternative slot or null
 */
export const findAlternativeSlot = async (timetableId, subjectId, classroomId, slotType) => {
    try {
        const timetable = await Timetable.findById(timetableId)
            .populate("schedule.slots.subject")
            .populate("schedule.slots.classroom");

        if (!timetable) return null;

        const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        // Look for free slots in the schedule
        for (const day of workingDays) {
            let schedule = timetable.schedule.find(s => s.day === day);

            // If no schedule for this day, create one
            if (!schedule) {
                schedule = { day: day, slots: [] };
                timetable.schedule.push(schedule);
            }

            // Find a free slot
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
 * @param {String} facultyId
 * @param {Date} leaveDate
 * @returns {Object} Suggestions object with conflicts and resolutions
 */
export const resolveLeaveConflicts = async (facultyId, leaveDate) => {
    try {
        // Step 1: Convert date to weekday
        const weekday = getWeekdayFromDate(leaveDate);
        console.log(`[LeaveConflictResolver] Processing leave for faculty ${facultyId} on ${leaveDate}. Weekday: ${weekday}`);

        // Step 2: Find all conflicting slots
        const conflictingSlots = await findConflictingSlots(facultyId, weekday);
        console.log(`[LeaveConflictResolver] Found ${conflictingSlots.length} conflicting slots`);

        if (conflictingSlots.length === 0) {
            return {
                hasConflicts: false,
                conflicts: [],
                resolutions: []
            };
        }

        // Step 3: Generate suggestions for each conflict
        const resolutions = [];

        for (const conflict of conflictingSlots) {
            const resolution = {
                conflict: conflict,
                suggestions: []
            };

            // Suggestion A: Find alternative faculty
            const alternativeFaculty = await findAlternativeFaculty(
                conflict.subject._id,
                conflict.day,
                conflict.time,
                facultyId
            );

            if (alternativeFaculty) {
                resolution.suggestions.push({
                    type: "FACULTY_REPLACEMENT",
                    priority: 1,
                    description: `Replace with ${alternativeFaculty.name}`,
                    details: alternativeFaculty,
                    status: "AVAILABLE"
                });
            }

            // Suggestion B: Find alternative time slot
            const alternativeSlot = await findAlternativeSlot(
                conflict.timetableId,
                conflict.subject._id,
                conflict.classroom._id,
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

            // Suggestion C: Mark for manual resolution
            if (resolution.suggestions.length === 0) {
                resolution.suggestions.push({
                    type: "MANUAL_RESOLUTION",
                    priority: 3,
                    description: "No automatic resolution found. Requires manual handling.",
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
 * @param {String} resolutionType - Type of resolution (FACULTY_REPLACEMENT, SLOT_RESCHEDULING)
 * @param {Object} conflictData - Original conflict data
 * @param {Object} suggestionData - Suggestion data to apply
 * @returns {Boolean} Success status
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
            // Replace the faculty with alternative faculty
            schedule.slots[slotIndex].faculty = suggestionData.id;
        } else if (resolutionType === "SLOT_RESCHEDULING") {
            // Move the slot to the alternative time
            const newSchedule = timetable.schedule.find(s => s.day === suggestionData.day);
            if (!newSchedule) return false;

            const newSlotIndex = newSchedule.slots.findIndex(s => s.time === suggestionData.time);
            if (newSlotIndex === -1) return false;

            // Move the slot
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
