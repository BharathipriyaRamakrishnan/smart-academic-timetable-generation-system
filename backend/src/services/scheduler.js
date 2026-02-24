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

export const generateSchedule = async ({ batchId, department } = {}) => {

    // ── 0. Fetch Settings ────────────────────────────────────────────────────
    const settings = await Settings.getSettings();

    const startTime = settings.startTime || "09:00";
    const endTime = settings.endTime || "17:00";
    const duration = settings.periodDuration || 60;
    const workingDays = settings.workingDays || 5;
    const maxContinuous = settings.maxContinuousClasses || 3;
    const maxLoad = settings.maxClassesPerWeek || 20;

    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const DAYS = allDays.slice(0, workingDays);

    // ── Build TIME_SLOTS ────────────────────────────────────────────────────
    const TIME_SLOTS = [];
    let current = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    const breaks = [
        settings.morningBreak?.startTime ? { start: timeToMinutes(settings.morningBreak.startTime), end: timeToMinutes(settings.morningBreak.endTime), type: "Break" } : null,
        settings.lunchBreak?.startTime ? { start: timeToMinutes(settings.lunchBreak.startTime), end: timeToMinutes(settings.lunchBreak.endTime), type: "Lunch" } : null,
        settings.eveningBreak?.startTime ? { start: timeToMinutes(settings.eveningBreak.startTime), end: timeToMinutes(settings.eveningBreak.endTime), type: "Break" } : null,
        ...((settings.breaks || []).map(b => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime), type: "Break" }))),
    ].filter(Boolean).sort((a, b) => a.start - b.start);

    while (current + duration <= end) {
        const slotStart = current;
        const slotEnd = current + duration;
        const collision = breaks.find(b => slotStart < b.end && slotEnd > b.start);

        if (collision) {
            const breakStr = `${minutesToTime(collision.start)}-${minutesToTime(collision.end)}`;
            const last = TIME_SLOTS[TIME_SLOTS.length - 1];
            if (!last || last.time !== breakStr) {
                TIME_SLOTS.push({ time: breakStr, type: collision.type });
            }
            current = Math.max(current, collision.end);
        } else {
            TIME_SLOTS.push({ time: `${minutesToTime(slotStart)}-${minutesToTime(slotEnd)}`, type: "Class" });
            current += duration;
        }
    }

    console.log(`[Scheduler] TIME_SLOTS (${TIME_SLOTS.length}):`, TIME_SLOTS.map(s => s.time));

    // ── 1. Fetch Batch ───────────────────────────────────────────────────────
    let batchQuery = {};
    if (batchId) batchQuery = { _id: batchId };
    else if (department) batchQuery = { department };

    const batches = await Batch.find(batchQuery);
    if (batches.length === 0) throw new Error("No batches found for selected criteria.");

    const classrooms = await Classroom.find();
    const faculties = await Faculty.find();

    // ── 2. Tracking ──────────────────────────────────────────────────────────
    const usedMap = {};  // usedMap[entityId][day][time] = true
    const loadMap = {};  // loadMap[facultyId] = count

    const markUsed = (id, day, time) => {
        if (!usedMap[id]) usedMap[id] = {};
        if (!usedMap[id][day]) usedMap[id][day] = {};
        usedMap[id][day][time] = true;
    };

    const isFree = (id, day, time) => !usedMap[id]?.[day]?.[time];

    const continuousOk = (facultyId, day, timeIdx) => {
        let count = 0;
        for (let i = timeIdx - 1; i >= 0; i--) {
            const s = TIME_SLOTS[i];
            if (s.type !== "Class") break;
            if (usedMap[facultyId]?.[day]?.[s.time]) count++;
            else break;
        }
        return count < maxContinuous;
    };

    const generatedTimetables = [];

    // ── 3. Schedule each Batch ──────────────────────────────────────────────
    for (const batch of batches) {
        console.log(`\n[Scheduler] Processing batch: ${batch.name}, dept: ${batch.department}, sem: ${batch.semester}`);

        const batchSchedule = {
            name: batch.name,
            department: batch.department,
            semester: batch.semester || 1,
            section: batch.section || "",
            studentGroup: batch.studentGroup || 1,
            schedule: DAYS.map(day => ({ day, slots: [] })),
        };

        // Find subjects by department + semester (case-insensitive dept match)
        const dept = batch.department;
        const sem = batch.semester || 1;

        let batchSubjects = await Subject.find({ semester: sem }).then(subs =>
            subs.filter(s => (s.departments || []).some(d => d.toLowerCase() === dept.toLowerCase()))
        );

        console.log(`[Scheduler] Subjects found for ${dept} sem ${sem}: ${batchSubjects.length}`);

        // Fallback: if no subjects for this semester, try any subject in this department
        if (batchSubjects.length === 0) {
            batchSubjects = await Subject.find().then(subs =>
                subs.filter(s => (s.departments || []).some(d => d.toLowerCase() === dept.toLowerCase()))
            );
            console.log(`[Scheduler] Fallback subjects for ${dept} (any sem): ${batchSubjects.length}`);
        }

        // Final fallback: use ALL subjects
        if (batchSubjects.length === 0) {
            batchSubjects = await Subject.find().limit(6);
            console.log(`[Scheduler] Using generic subjects as last resort: ${batchSubjects.length}`);
        }

        // Find eligible faculty (dept match, case-insensitive; fallback = any faculty)
        let deptFaculty = faculties.filter(f => f.department?.toLowerCase() === dept.toLowerCase());
        if (deptFaculty.length === 0) deptFaculty = faculties;
        console.log(`[Scheduler] Faculty eligible: ${deptFaculty.length}`);

        // Find classrooms: capacity >= studentsCount (or any if none found)
        const needed = batch.studentsCount || 0;
        let lectureRooms = classrooms.filter(c => c.type === "Lecture Hall" && c.capacity >= needed);
        let labRooms = classrooms.filter(c => c.type === "Laboratory");
        if (lectureRooms.length === 0) lectureRooms = classrooms.filter(c => c.type === "Lecture Hall");
        if (lectureRooms.length === 0) lectureRooms = classrooms;        // last resort
        if (labRooms.length === 0) labRooms = classrooms;
        console.log(`[Scheduler] Lecture rooms: ${lectureRooms.length}, Lab rooms: ${labRooms.length}`);

        for (const subject of batchSubjects) {
            let toSchedule = subject.lecturesPerWeek || 3;
            const isLab = subject.type === "Lab";
            const sessionLen = isLab ? Math.max(1, settings.labMinDuration || 2) : 1;
            const rooms = isLab ? labRooms : lectureRooms;

            // Pick faculty with lowest load for this subject
            const eligible = deptFaculty.filter(f => (loadMap[f._id] || 0) < maxLoad);
            if (eligible.length === 0) {
                console.log(`  [Skip] All faculty overloaded for "${subject.name}"`);
                continue;
            }
            eligible.sort((a, b) => (loadMap[a._id] || 0) - (loadMap[b._id] || 0));
            const faculty = eligible[0];

            if (rooms.length === 0) {
                console.log(`  [Skip] No rooms for "${subject.name}" (isLab: ${isLab})`);
                continue;
            }

            let scheduled = 0;

            outer:
            for (let attempt = 0; attempt < 200 && toSchedule > 0; attempt++) {
                for (const day of DAYS) {
                    const daySch = batchSchedule.schedule.find(s => s.day === day);

                    for (let i = 0; i < TIME_SLOTS.length; i++) {
                        // Check all periods for this session block
                        if (i + sessionLen > TIME_SLOTS.length) continue;

                        let canFit = true;
                        for (let k = 0; k < sessionLen; k++) {
                            const slot = TIME_SLOTS[i + k];
                            if (slot.type !== "Class") { canFit = false; break; }
                            if (!isFree(batch._id.toString(), day, slot.time)) { canFit = false; break; }
                            if (!isFree(faculty._id.toString(), day, slot.time)) { canFit = false; break; }
                        }
                        if (!canFit) continue;

                        if (!continuousOk(faculty._id.toString(), day, i)) continue;

                        // Assign a room not already used at this time
                        const room = rooms.find(r => isFree(r._id.toString(), day, TIME_SLOTS[i].time)) || rooms[0];

                        // Book all periods in session
                        for (let k = 0; k < sessionLen; k++) {
                            const slot = TIME_SLOTS[i + k];
                            markUsed(batch._id.toString(), day, slot.time);
                            markUsed(faculty._id.toString(), day, slot.time);
                            markUsed(room._id.toString(), day, slot.time);
                            loadMap[faculty._id] = (loadMap[faculty._id] || 0) + 1;

                            daySch.slots.push({
                                time: slot.time,
                                subject: subject._id,
                                faculty: faculty._id,
                                classroom: room._id,
                                type: subject.type === "Lab" ? "Lab" : "Lecture",
                            });
                        }

                        toSchedule -= sessionLen;
                        scheduled++;
                        continue outer;
                    }
                }
                // No slot found in this pass — give up for this subject
                break;
            }

            console.log(`  "${subject.name}": scheduled ${scheduled} session(s), lecturesPerWeek=${subject.lecturesPerWeek}`);
        }

        // Sort each day's slots by time
        batchSchedule.schedule.forEach(d => {
            d.slots.sort((a, b) => a.time.localeCompare(b.time));
        });

        const totalSlots = batchSchedule.schedule.reduce((s, d) => s + d.slots.length, 0);
        console.log(`[Scheduler] Batch "${batch.name}": ${totalSlots} total slots scheduled`);

        generatedTimetables.push(batchSchedule);
    }

    // ── 4. Save ──────────────────────────────────────────────────────────────
    if (batchId) {
        // Only delete timetable for this specific batch (by name+dept), not all
        await Timetable.deleteMany({ name: { $in: generatedTimetables.map(t => t.name) } });
    } else {
        await Timetable.deleteMany({});
    }

    const saved = await Timetable.insertMany(generatedTimetables);
    return saved;
};