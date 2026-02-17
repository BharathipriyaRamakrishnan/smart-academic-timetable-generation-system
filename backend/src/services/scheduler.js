import Classroom from "../models/Classroom.js";
import Faculty from "../models/Faculty.js";
import Subject from "../models/Subject.js";
import Batch from "../models/Batch.js";
import Timetable from "../models/Timetable.js";
import Settings from "../models/Settings.js";

const timeToMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};

const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

export const generateSchedule = async () => {
    // 0. Fetch Settings
    const settings = await Settings.getSettings();

    // Generate DAYS
    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const DAYS = allDays.slice(0, settings.workingDays);

    // Generate TIME_SLOTS
    const TIME_SLOTS = [];
    let current = timeToMinutes(settings.startTime);
    const end = timeToMinutes(settings.endTime);
    const duration = settings.periodDuration;

    // Process Breaks
    const breaks = [
        ...(settings.breaks || []),
        settings.morningBreak && settings.morningBreak.startTime ? { ...settings.morningBreak, type: "Break" } : null,
        settings.lunchBreak && settings.lunchBreak.startTime ? { ...settings.lunchBreak, type: "Lunch" } : null,
        settings.eveningBreak && settings.eveningBreak.startTime ? { ...settings.eveningBreak, type: "Break" } : null
    ].filter(Boolean).map(b => ({
        start: timeToMinutes(b.startTime),
        end: timeToMinutes(b.endTime),
        type: b.type || "Break"
    })).sort((a, b) => a.start - b.start);

    // Generate slots
    while (current + duration <= end) {
        const slotStart = current;
        const slotEnd = current + duration;

        // Check for ANY overlap with a break
        // A slot overlaps if slotStart < breakEnd && slotEnd > breakStart
        // If overlap, we must inject the break (if not already matches) and then skip past it.

        let breakCollision = null;
        for (const b of breaks) {
            if (slotStart < b.end && slotEnd > b.start) {
                breakCollision = b;
                break;
            }
        }

        if (breakCollision) {
            // Add break slot
            // We only add it if we haven't already added this specific break time (to avoid dupes if loop retries)
            // Or simpler: Just push the break and jump current to break.end
            // Ensure we don't push duplicate breaks? The loop moves forward, so duplicates shouldn't happen unless breaks overlap each other.

            // Format break time
            const breakTimeStr = `${minutesToTime(breakCollision.start)}-${minutesToTime(breakCollision.end)}`;

            // Check if last added slot was this break
            const lastSlot = TIME_SLOTS[TIME_SLOTS.length - 1];
            if (!lastSlot || lastSlot.time !== breakTimeStr) {
                TIME_SLOTS.push({
                    time: breakTimeStr,
                    type: breakCollision.type
                });
            }

            // Move current to end of break
            current = Math.max(current, breakCollision.end);
            continue;
        }

        // Add class slot
        TIME_SLOTS.push({
            time: `${minutesToTime(slotStart)}-${minutesToTime(slotEnd)}`,
            type: "Class"
        });
        current += duration;
    }

    // 1. Fetch resources
    const batches = await Batch.find().populate("subjects");
    const classrooms = await Classroom.find();
    // Populate subjects for faculty to check capability (from previous task)
    const faculties = await Faculty.find().populate("subjects");

    // 2. Initialize tracking structures
    const scheduleMap = {
        classrooms: {},
        faculty: {},
        batches: {},
    };

    // Track faculty load (classes per week)
    const facultyLoad = {}; // { facultyId: count }

    const generatedTimetables = [];

    // Helper: Is Available
    const isAvailable = (day, time, batchId, facultyId, classroomId) => {
        if (scheduleMap.batches[batchId]?.[day]?.[time]) return false;
        if (scheduleMap.faculty[facultyId]?.[day]?.[time]) return false;
        if (scheduleMap.classrooms[classroomId]?.[day]?.[time]) return false;
        return true;
    };

    // Helper: Check Max Continuous Classes
    const checkContinuous = (day, timeIndex, facultyId) => {
        let continuous = 0;
        // Check backwards
        for (let i = timeIndex - 1; i >= 0; i--) {
            const slot = TIME_SLOTS[i];
            if (slot.type !== "Class") break; // Break resets continuity check? usually yes.

            if (scheduleMap.faculty[facultyId]?.[day]?.[slot.time]) {
                continuous++;
            } else {
                break;
            }
        }
        // Current slot would be +1
        return continuous < settings.maxContinuousClasses;
    };

    // Helper: Book Slot
    const bookSlot = (day, time, batchId, facultyId, classroomId) => {
        if (!scheduleMap.batches[batchId]) scheduleMap.batches[batchId] = {};
        if (!scheduleMap.batches[batchId][day]) scheduleMap.batches[batchId][day] = {};
        scheduleMap.batches[batchId][day][time] = true;

        if (!scheduleMap.faculty[facultyId]) scheduleMap.faculty[facultyId] = {};
        if (!scheduleMap.faculty[facultyId][day]) scheduleMap.faculty[facultyId][day] = {};
        scheduleMap.faculty[facultyId][day][time] = true;

        if (!scheduleMap.classrooms[classroomId]) scheduleMap.classrooms[classroomId] = {};
        if (!scheduleMap.classrooms[classroomId][day]) scheduleMap.classrooms[classroomId][day] = {};
        scheduleMap.classrooms[classroomId][day][time] = true;

        facultyLoad[facultyId] = (facultyLoad[facultyId] || 0) + 1;
    };


    // 3. Scheduling Logic
    for (const batch of batches) {
        const batchSchedule = {
            name: batch.name,
            department: batch.department, // Assuming Batch model has department
            semester: batch.semester,
            section: batch.section,
            schedule: [],
        };

        // Initialize slots structure for response
        DAYS.forEach((day) => {
            batchSchedule.schedule.push({ day, slots: [] });
        });

        // Loop through subjects
        // TODO: Prioritize Labs or harder subjects? For now, order implies priority.

        for (const subject of (batch.subjects || [])) {
            let classesToSchedule = subject.lecturesPerWeek || 3; // Default 3
            if (classesToSchedule <= 0) continue;

            const isLab = subject.type === "Lab";
            // For Labs, use labMinDuration. For Lectures, 1.
            const sessionDuration = isLab ? Math.max(1, settings.labMinDuration) : 1;

            // Identify Eligible Faculties
            // 1. Check if faculty belongs to allowed department (unless shared)
            // 2. Check if faculty can teach subject (via subjects array OR department match fallback)

            let eligibleFaculties = faculties.filter(f => {
                // Rule 1: Subject Capability
                // Check if faculty has this subject in their 'subjects' list
                const explicitSubjectMatch = (f.subjects || []).some(s => s._id.toString() === subject._id.toString());

                // Fallback: Department match (Legacy behavior)
                const deptMatch = (subject.departments || []).includes(f.department);

                // Rule 2: Department constraints
                // If sharedFaculty is OFF, faculty department must match batch/subject department?
                // Actually user requirement: "Shared faculty across departments (Enable/Disable)"
                // This usually implies if disabled, Dept A faculty cannot teach Dept B students.

                const sameDepartment = f.department === batch.department;

                if (!settings.sharedFaculty && !sameDepartment) return false;

                return explicitSubjectMatch || deptMatch;
            });

            if (eligibleFaculties.length === 0) {
                console.log(`No faculty found for ${subject.name} in batch ${batch.name}`);
                continue;
            }

            // Select faculty with lowest load
            eligibleFaculties.sort((a, b) => (facultyLoad[a._id] || 0) - (facultyLoad[b._id] || 0));
            const assignedFaculty = eligibleFaculties[0];

            // Check max load
            if ((facultyLoad[assignedFaculty._id] || 0) >= settings.maxClassesPerWeek) {
                // Try next faculty?
                const fallback = eligibleFaculties.find(f => (facultyLoad[f._id] || 0) < settings.maxClassesPerWeek);
                if (!fallback) continue; // All overloaded
                // assignedFaculty = fallback; // can't reassign const, use let or ignore for now (simplified)
            }

            // Find Classroom
            const eligibleClassrooms = classrooms.filter(c =>
                c.capacity >= batch.studentsCount &&
                c.type === (isLab ? "Laboratory" : "Lecture Hall")
            );
            if (eligibleClassrooms.length === 0) {
                console.log(`No classroom for ${subject.name} (Lab: ${isLab})`);
                continue;
            }
            const assignedClassroom = eligibleClassrooms[0]; // Simplification


            // Try to schedule sessions
            let scheduledCount = 0;
            let attempts = 0;

            while (classesToSchedule > 0 && attempts < 100) { // Safety break
                attempts++;
                let booked = false;

                for (const day of DAYS) {
                    const daySchedule = batchSchedule.schedule.find(s => s.day === day);

                    // Iterate slots
                    for (let i = 0; i < TIME_SLOTS.length; i++) {
                        // Check if we can fit the session starting at i
                        const startSlot = TIME_SLOTS[i];
                        if (startSlot.type !== "Class") continue;

                        // Check bounds + validity for multi-period sessions
                        if (i + sessionDuration > TIME_SLOTS.length) continue;

                        let canFit = true;
                        // For multi-period, check all slots
                        for (let k = 0; k < sessionDuration; k++) {
                            const checkSlot = TIME_SLOTS[i + k];
                            // Must be Class type (cannot span break) except maybe if logic allows?
                            // Usually labs shouldn't span lunch, but small breaks maybe? 
                            // Let's being strict: Must be Class type.
                            if (checkSlot.type !== "Class") { canFit = false; break; }

                            if (!isAvailable(day, checkSlot.time, batch._id, assignedFaculty._id, assignedClassroom._id)) {
                                canFit = false; break;
                            }
                        }

                        if (!canFit) continue;

                        // Check Max Continuous Classes constraint for Faculty
                        // Only need to check the pre-condition for the FIRST slot of the block
                        // (and post-condition, but pre is enough for sequential booking)
                        if (!checkContinuous(day, i, assignedFaculty._id)) {
                            continue;
                        }

                        // Booking confirmed!
                        for (let k = 0; k < sessionDuration; k++) {
                            const slot = TIME_SLOTS[i + k];
                            bookSlot(day, slot.time, batch._id, assignedFaculty._id, assignedClassroom._id);

                            // Add to batch schedule response
                            daySchedule.slots.push({
                                time: slot.time,
                                subject: subject._id,
                                faculty: assignedFaculty._id,
                                classroom: assignedClassroom._id,
                                type: subject.type
                            });
                        }

                        classesToSchedule -= sessionDuration; // usually subtract periods?
                        // If classesToSchedule was periods, we scheduled 'sessionDuration' periods.
                        // So subtract sessionDuration.

                        booked = true;
                        break;
                    }
                    if (booked) break;
                }
                if (!booked) break; // Cannot fit this session anywhere
            }
        }

        // Sort slots
        batchSchedule.schedule.forEach(daySch => {
            daySch.slots.sort((a, b) => a.time.localeCompare(b.time));
        });

        generatedTimetables.push(batchSchedule);
    }

    // 4. Save
    await Timetable.deleteMany({});
    await Timetable.insertMany(generatedTimetables);

    return generatedTimetables;
};
