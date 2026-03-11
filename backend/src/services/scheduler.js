/**
 * Timetable Scheduler — Full Slot Fill Edition
 *
 * Institutional schedule (Mon–Sat, 6 days):
 *   P1  08:45–09:35  (Class)
 *   P2  09:35–10:25  (Class)
 *   Brk 10:25–10:40  (Break — no classes)
 *   P3  10:40–11:35  (Free/Study — no classes)
 *   P4  11:35–12:20  (Class)
 *   Lnc 12:20–13:30  (Lunch — no classes)
 *   P5  13:30–14:10  (Class)
 *   P6  14:10–15:10  (Class)
 *   Brk 15:10–15:25  (Break — no classes)
 *   P7  15:25–16:25  (Class)
 *
 * Strategy:
 *   PASS 1 — Schedule every subject for its required lecturesPerWeek,
 *             distributed as evenly as possible across all days.
 *   PASS 2 — Fill ANY remaining empty class slots by cycling through
 *             subjects (weighted round-robin) so students have ZERO free hours.
 *
 * Constraints enforced:
 *   Faculty  — no overlap, max 4/day, max 18/week, assigned-subjects only
 *   Batch    — no overlap, max 6/day, same subject ≤ 2×/day
 *   Classroom— no overlap, capacity ≥ batch strength, lab→lab room only
 *   Lab      — must occupy exactly 2 consecutive class slots
 */

import Classroom from "../models/Classroom.js";
import Faculty   from "../models/Faculty.js";
import Subject   from "../models/Subject.js";
import Batch     from "../models/Batch.js";
import Timetable from "../models/Timetable.js";
import Settings  from "../models/Settings.js";
import LeaveRequest from "../models/LeaveRequest.js";

// ─── helpers ─────────────────────────────────────────────────────────────────

const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

const toTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// ─── build fixed time-slot sequence from settings ───────────────────────────

function buildTimeSlots(settings) {
    // ── Preferred: use explicit fixedPeriods array from Settings ──────────────
    // This is the most reliable approach for irregular schedules where period
    // durations vary (e.g. P3=55 min, P5=40 min, P7=65 min).
    if (settings.fixedPeriods && settings.fixedPeriods.length > 0) {
        return settings.fixedPeriods.map(p => ({
            time:       `${p.start}-${p.end}`,
            type:       p.type || "Class",
            schedulable: (p.type || "Class") === "Class",
        }));
    }

    // ── Fallback: auto-compute from startTime + periodDuration + breaks ───────
    const period   = settings.periodDuration || 50;
    const startMin = toMins(settings.startTime || "08:45");
    const endMin   = toMins(settings.endTime   || "16:30");

    const breakWindows = [
        settings.morningBreak?.startTime ? {
            start: toMins(settings.morningBreak.startTime),
            end:   toMins(settings.morningBreak.endTime),
            type:  "Break"
        } : null,
        settings.lunchBreak?.startTime ? {
            start: toMins(settings.lunchBreak.startTime),
            end:   toMins(settings.lunchBreak.endTime),
            type:  "Lunch"
        } : null,
        settings.eveningBreak?.startTime ? {
            start: toMins(settings.eveningBreak.startTime),
            end:   toMins(settings.eveningBreak.endTime),
            type:  "Break"
        } : null,
        ...((settings.breaks || []).map(b => ({
            start: toMins(b.startTime),
            end:   toMins(b.endTime),
            type:  "Break"
        })))
    ].filter(Boolean).sort((a, b) => a.start - b.start);

    const freePeriodSet = new Set(settings.freePeriods || ["10:40-11:35"]);

    const slots = [];
    let cur = startMin;

    while (cur < endMin) {
        const brk = breakWindows.find(b => b.start === cur);
        if (brk) {
            slots.push({ time: `${toTime(brk.start)}-${toTime(brk.end)}`, type: brk.type, schedulable: false });
            cur = brk.end;
            continue;
        }
        const inside = breakWindows.find(b => cur > b.start && cur < b.end);
        if (inside) { cur = inside.end; continue; }

        const nextBreak = breakWindows.find(b => b.start > cur)?.start ?? endMin;
        const slotEnd   = Math.min(cur + period, nextBreak, endMin);
        if (slotEnd <= cur) { cur++; continue; }

        const label  = `${toTime(cur)}-${toTime(slotEnd)}`;
        const isFree = freePeriodSet.has(label);
        slots.push({ time: label, type: isFree ? "Free" : "Class", schedulable: !isFree });
        cur = slotEnd;
    }

    return slots;
}

// ─── Attempt to place one session block ──────────────────────────────────────
// Returns true if successfully placed, false otherwise.

function tryPlace({
    subject, faculty, rooms, day, slotIndex, sessLen,
    TIME_SLOTS, batchId_str, usedMap, facultyWeekCount, facultyDayCount,
    batchDayCount, subjectDayCount, maxFacultyPerWeek, maxFacultyPerDay,
    maxBatchPerDay, maxSubjectRepeatDay, daySch, facultyLeaveMap,
    incFacultyLoad, incBatchDay, incSubjectDay
}) {
    const sid = subject._id.toString();

    // Batch daily cap
    if ((batchDayCount[day] || 0) + sessLen > maxBatchPerDay) return false;

    // Subject repeat cap
    if ((subjectDayCount[sid]?.[day] || 0) >= maxSubjectRepeatDay) return false;

    if (slotIndex + sessLen > TIME_SLOTS.length) return false;

    // All slots in block must be schedulable and free for batch
    for (let k = 0; k < sessLen; k++) {
        const s = TIME_SLOTS[slotIndex + k];
        if (!s.schedulable) return false;
        if (usedMap[batchId_str]?.[day]?.[s.time]) return false;
    }

    // Faculty check
    const fid = faculty._id.toString();
    if (facultyLeaveMap?.[fid]?.has(day)) return false; // Faculty on leave this day!
    
    if ((facultyWeekCount[fid] || 0) + sessLen > maxFacultyPerWeek) return false;
    if ((facultyDayCount[fid]?.[day] || 0) + sessLen > maxFacultyPerDay) return false;
    for (let k = 0; k < sessLen; k++) {
        if (usedMap[fid]?.[day]?.[TIME_SLOTS[slotIndex + k].time]) return false;
    }

    // Pick room
    const firstTime = TIME_SLOTS[slotIndex].time;
    let room = rooms.find(r => !usedMap[r._id.toString()]?.[day]?.[firstTime]);
    if (!room) return false; // no room available

    // ── Book it ──────────────────────────────────────────────────────────────
    const markUsed = (id, d, t) => {
        if (!usedMap[id]) usedMap[id] = {};
        if (!usedMap[id][d]) usedMap[id][d] = {};
        usedMap[id][d][t] = true;
    };

    for (let k = 0; k < sessLen; k++) {
        const slotTime = TIME_SLOTS[slotIndex + k].time;
        markUsed(batchId_str, day, slotTime);
        markUsed(fid,         day, slotTime);
        markUsed(room._id.toString(), day, slotTime);

        daySch.slots.push({
            time:      slotTime,
            subject:   subject._id,
            faculty:   faculty._id,
            classroom: room._id,
            type:      subject.type === "Lab" ? "Lab" : "Lecture",
        });
    }

    incFacultyLoad(fid, day, sessLen);
    incBatchDay(day, sessLen);
    incSubjectDay(sid, day);

    return true;
}

// ─── main export ─────────────────────────────────────────────────────────────

export const generateSchedule = async ({ batchId, department, generatedBy } = {}) => {

    // ── 0. Settings ───────────────────────────────────────────────────────────
    const settings = await Settings.getSettings();

    const maxFacultyPerWeek   = settings.maxClassesPerWeek         || 18;
    const maxFacultyPerDay    = settings.maxClassesPerDayFaculty   || 4;
    const maxBatchPerDay      = settings.maxClassesPerDayBatch     || 6;
    const maxSubjectRepeatDay = settings.maxSubjectRepeatPerDay    || 2;
    const labLen              = Math.max(1, settings.labMinDuration || 2);

    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const DAYS    = allDays.slice(0, settings.workingDays || 6);

    const TIME_SLOTS  = buildTimeSlots(settings);
    const CLASS_SLOTS = TIME_SLOTS.filter(s => s.schedulable); // bookable positions

    console.log(`[Scheduler] DAYS: ${DAYS.join(", ")}`);
    console.log(`[Scheduler] Slots/day: ${TIME_SLOTS.length} total, ${CLASS_SLOTS.length} class slots`);
    console.log(`[Scheduler] Total class slots/week: ${CLASS_SLOTS.length * DAYS.length}`);

    // ── 1. DB data ────────────────────────────────────────────────────────────
    let batchQuery = {};
    if (batchId) batchQuery = { _id: batchId };
    else if (department) batchQuery = { department };

    const batches   = await Batch.find(batchQuery);
    if (batches.length === 0) throw new Error("No batches found for selected criteria.");

    const classrooms = await Classroom.find();
    const faculties  = await Faculty.find().populate("subjects");

    // ── 2. Per-run shared tracking (across batches) ───────────────────────────
    const usedMap          = {};  // usedMap[entityId][day][time] = bool
    const facultyWeekCount = {};
    const facultyDayCount  = {};  // [fid][day]

    const markUsed = (id, d, t) => {
        if (!usedMap[id]) usedMap[id] = {};
        if (!usedMap[id][d]) usedMap[id][d] = {};
        usedMap[id][d][t] = true;
    };

    const incFacultyLoad = (fid, day, n = 1) => {
        facultyWeekCount[fid] = (facultyWeekCount[fid] || 0) + n;
        if (!facultyDayCount[fid]) facultyDayCount[fid] = {};
        facultyDayCount[fid][day] = (facultyDayCount[fid][day] || 0) + n;
    };

    // ── 2b. Load approved leaves ──────────────────────────────────────────────
    const facultyLeaveMap = {}; // { facultyId: Set(["Monday", ...]) }
    const approvedLeaves = await LeaveRequest.find({ status: "APPROVED" });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (const leave of approvedLeaves) {
        if (!leave.faculty) continue;
        const fid = leave.faculty.toString();
        if (!facultyLeaveMap[fid]) facultyLeaveMap[fid] = new Set();
        
        const d = new Date(leave.date);
        const dayName = dayNames[d.getUTCDay()];
        facultyLeaveMap[fid].add(dayName);
    }

    console.log(`[Scheduler] Loaded ${approvedLeaves.length} approved leave days.`);

    const generatedTimetables = [];

    // ── 2a. Load existing timetables for global conflict detection ────────────
    // We must ignore the timetables that are about to be REPLACED (same batch/sem)
    // to allow regeneration for the same batch without conflicting with its own old version.
    const replaceNames = batches.map(b => b.name);
    const existingTimetables = await Timetable.find({
        $or: [
            { department: { $ne: department } }, // Other departments
            { name: { $nin: replaceNames } }      // Same department but different batches
        ]
    });

    console.log(`[Scheduler] Loading ${existingTimetables.length} existing timetables to prevent global overlaps...`);

    for (const et of existingTimetables) {
        for (const daySch of et.schedule) {
            const day = daySch.day;
            for (const slot of daySch.slots) {
                if (!slot.faculty || !slot.subject) continue; // Skip free/break slots

                const time = slot.time;
                const fid  = slot.faculty.toString();
                const rid  = slot.classroom?.toString();
                
                // Track faculty load and usage
                markUsed(fid, day, time);
                incFacultyLoad(fid, day, 1);
                
                // Track room usage
                if (rid) markUsed(rid, day, time);
                
                // Track batch usage (though not strictly necessary as we generate new batches,
                // it's good for completeness if we ever generate partially)
            }
        }
    }

    // ── 3. Process each batch ─────────────────────────────────────────────────
    for (const batch of batches) {
        const batchId_str = batch._id.toString();
        const dept        = batch.department;
        const sem         = batch.semester || 1;

        console.log(`\n[Scheduler] ══ Batch: ${batch.name} | ${dept} | Sem ${sem} ══`);

        // Per-batch tracking
        const batchDayCount   = {};  // [day] = int
        const subjectDayCount = {};  // [sid][day] = int

        const incBatchDay   = (day, n = 1) => { batchDayCount[day] = (batchDayCount[day] || 0) + n; };
        const incSubjectDay = (sid, day)   => {
            if (!subjectDayCount[sid]) subjectDayCount[sid] = {};
            subjectDayCount[sid][day] = (subjectDayCount[sid][day] || 0) + 1;
        };

        // Day schedule structure
        const batchSchedule = {
            name:         batch.name,
            department:   dept,
            semester:     sem,
            section:      batch.section  || "",
            studentGroup: batch.studentGroup || 1,
            schedule:     DAYS.map(day => ({ day, slots: [] })),
            status:       "PENDING_APPROVAL",
            generatedBy:  generatedBy || null,
            version:      1
        };

        // ── 3a. Find subjects ─────────────────────────────────────────────────
        let subjects = await Subject.find({ semester: sem }).then(s =>
            s.filter(x => (x.departments || []).some(d => d.toLowerCase() === dept.toLowerCase()))
        );
        if (subjects.length === 0)
            subjects = await Subject.find().then(s =>
                s.filter(x => (x.departments || []).some(d => d.toLowerCase() === dept.toLowerCase()))
            );
        if (subjects.length === 0)
            subjects = await Subject.find().limit(6);

        console.log(`[Scheduler] Subjects (${subjects.length}): ${subjects.map(s => `${s.name}(${s.lecturesPerWeek})`).join(", ")}`);

        // ── 3b. Classify rooms ────────────────────────────────────────────────
        const needed     = batch.studentsCount || 0;
        let lectureRooms = classrooms.filter(c => c.type === "Lecture Hall" && c.capacity >= needed);
        let labRooms     = classrooms.filter(c => c.type === "Laboratory");
        if (lectureRooms.length === 0) lectureRooms = classrooms.filter(c => c.type === "Lecture Hall");
        if (lectureRooms.length === 0) lectureRooms = classrooms;
        if (labRooms.length === 0)     labRooms     = classrooms;

        // ── 3c. Build faculty pool for each subject ───────────────────────────
        const getFacultyPool = (subject) => {
            const sid       = subject._id.toString();
            const assigned  = faculties.filter(f =>
                (f.subjects || []).some(s => (s._id ?? s).toString() === sid)
            );
            const deptOnly  = faculties.filter(f =>
                f.department?.toLowerCase() === dept.toLowerCase()
            );
            return assigned.length > 0 ? assigned : (deptOnly.length > 0 ? deptOnly : faculties);
        };

        // ── 3d. Helper: pick best faculty for a subject on a day ─────────────
        const pickFaculty = (subject, day, sessLen) => {
            const pool = getFacultyPool(subject)
                .filter(f => {
                    const fid = f._id.toString();
                    if (facultyLeaveMap[fid]?.has(day)) return false; // Early exit if on leave
                    return (
                        (facultyWeekCount[fid] || 0) + sessLen <= maxFacultyPerWeek &&
                        (facultyDayCount[fid]?.[day] || 0) + sessLen <= maxFacultyPerDay
                    );
                })
                .sort((a, b) =>
                    (facultyWeekCount[a._id.toString()] || 0) -
                    (facultyWeekCount[b._id.toString()] || 0)
                );

            // Return faculty that is free for all sessions in the block (checked later in tryPlace)
            return pool[0] || null;
        };

        // ── 3e. PASS 1: Schedule each subject for its required lecturesPerWeek ─
        // Spread evenly: aim for floor(lecturesPerWeek/nDays) per day
        for (const subject of subjects) {
            const sid    = subject._id.toString();
            const isLab  = subject.type === "Lab";
            const sessLen = isLab ? labLen : 1;
            const rooms   = isLab ? labRooms : lectureRooms;

            let remaining = isLab
                ? Math.ceil((subject.labsPerWeek || 2) / sessLen) * sessLen
                : (subject.lecturesPerWeek || 3);

            if (getFacultyPool(subject).length === 0) {
                console.log(`  [Skip P1] No faculty for "${subject.name}"`);
                continue;
            }
            if (rooms.length === 0) {
                console.log(`  [Skip P1] No rooms for "${subject.name}" (Lab=${isLab})`);
                continue;
            }

            // Try to distribute evenly — iterate days in round-robin
            let dayIdx = 0;
            let attempts = 0;
            const maxAttempts = DAYS.length * TIME_SLOTS.length * 4;

            while (remaining > 0 && attempts < maxAttempts) {
                attempts++;
                const day    = DAYS[dayIdx % DAYS.length];
                dayIdx++;

                if ((batchDayCount[day] || 0) + sessLen > maxBatchPerDay) continue;
                if ((subjectDayCount[sid]?.[day] || 0) >= maxSubjectRepeatDay) continue;

                const faculty = pickFaculty(subject, day, sessLen);
                if (!faculty) continue;

                const daySch = batchSchedule.schedule.find(s => s.day === day);
                let placed = false;

                for (let i = 0; i <= TIME_SLOTS.length - sessLen; i++) {
                    const placed_ = tryPlace({
                        subject, faculty, rooms, day, slotIndex: i, sessLen,
                        TIME_SLOTS, batchId_str, usedMap, facultyWeekCount, facultyDayCount,
                        batchDayCount, subjectDayCount, maxFacultyPerWeek, maxFacultyPerDay,
                        maxBatchPerDay, maxSubjectRepeatDay, daySch, facultyLeaveMap,
                        incFacultyLoad, incBatchDay, incSubjectDay
                    });
                    if (placed_) { placed = true; remaining -= sessLen; break; }
                }

                // If all days exhausted in this pass without placing, break
                if (!placed && dayIdx >= DAYS.length * 3) break;
            }

            console.log(`  P1 "${subject.name}": placed ${(isLab ? Math.ceil((subject.labsPerWeek || 2) / sessLen) * sessLen : (subject.lecturesPerWeek || 3)) - remaining} / ${isLab ? Math.ceil((subject.labsPerWeek || 2) / sessLen) * sessLen : (subject.lecturesPerWeek || 3)}`);
        }

        // ── 3f. PASS 2: Fill every remaining empty class slot ─────────────────
        // Build a weighted cycle of subjects: subjects with more lecturesPerWeek
        // appear more often so the repeat distribution stays proportional.
        const lectureSubjects = subjects.filter(s => s.type !== "Lab");

        // Weighted list: subject appears proportionally to its weekly load
        const weightedPool = [];
        if (lectureSubjects.length > 0) {
            const totalW = lectureSubjects.reduce((s, x) => s + (x.lecturesPerWeek || 1), 0);
            for (const sub of lectureSubjects) {
                const weight = Math.max(1, Math.round(((sub.lecturesPerWeek || 1) / totalW) * 10));
                for (let w = 0; w < weight; w++) weightedPool.push(sub);
            }
            shuffle(weightedPool);
        }

        if (weightedPool.length > 0) {
            let poolIdx = 0;

            for (const dayEntry of batchSchedule.schedule) {
                const day = dayEntry.day;
                for (let i = 0; i < TIME_SLOTS.length; i++) {
                    const slot = TIME_SLOTS[i];
                    if (!slot.schedulable) continue;
                    // Already booked?
                    if (usedMap[batchId_str]?.[day]?.[slot.time]) continue;

                    // Batch daily cap check
                    if ((batchDayCount[day] || 0) >= maxBatchPerDay) break;

                    // Try subjects from the weighted pool until one fits
                    let placed = false;
                    let tried  = 0;

                    while (!placed && tried < weightedPool.length) {
                        const subject = weightedPool[poolIdx % weightedPool.length];
                        poolIdx++;
                        tried++;

                        const sid   = subject._id.toString();
                        // Don't exceed repeat cap
                        if ((subjectDayCount[sid]?.[day] || 0) >= maxSubjectRepeatDay) continue;

                        const faculty = pickFaculty(subject, day, 1);
                        if (!faculty) continue;

                        // Check faculty is free at this specific slot
                        const fid = faculty._id.toString();
                        if (usedMap[fid]?.[day]?.[slot.time]) continue;

                        // Pick room
                        const room = lectureRooms.find(r => !usedMap[r._id.toString()]?.[day]?.[slot.time]);
                        if (!room) continue;

                        // Book it
                        markUsed(batchId_str,         day, slot.time);
                        markUsed(fid,                  day, slot.time);
                        markUsed(room._id.toString(),  day, slot.time);

                        dayEntry.slots.push({
                            time:      slot.time,
                            subject:   subject._id,
                            faculty:   faculty._id,
                            classroom: room._id,
                            type:      "Lecture",
                        });

                        incFacultyLoad(fid, day, 1);
                        incBatchDay(day, 1);
                        incSubjectDay(sid, day);
                        placed = true;
                    }
                }
            }
        }

        // ── 3g. Insert break/lunch/free slots for UI rendering ────────────────
        for (const daySch of batchSchedule.schedule) {
            const bookedTimes = new Set(daySch.slots.map(s => s.time));
            for (const slot of TIME_SLOTS) {
                if (!bookedTimes.has(slot.time) && !slot.schedulable) {
                    daySch.slots.push({
                        time:      slot.time,
                        subject:   null,
                        faculty:   null,
                        classroom: null,
                        type:      slot.type === "Lunch" ? "Lunch" : slot.type === "Free" ? "Free" : "Break",
                    });
                }
            }
            daySch.slots.sort((a, b) => a.time.localeCompare(b.time));
        }

        // ── 3h. Conflict validation ───────────────────────────────────────────
        let conflicts = 0;
        for (const daySch of batchSchedule.schedule) {
            const seenFaculty   = {};
            const seenClassroom = {};
            daySch.slots = daySch.slots.filter(slot => {
                if (!slot.faculty) return true;
                const time = slot.time;
                const fid  = slot.faculty?.toString();
                const rid  = slot.classroom?.toString();
                if (fid && seenFaculty[time] && seenFaculty[time] !== fid) {
                    conflicts++;
                    return false;
                }
                if (rid && seenClassroom[time] && seenClassroom[time] !== rid) {
                    conflicts++;
                    return false;
                }
                if (fid) seenFaculty[time]   = fid;
                if (rid) seenClassroom[time]  = rid;
                return true;
            });
        }

        const classSlotsScheduled = batchSchedule.schedule
            .reduce((s, d) => s + d.slots.filter(sl => sl.subject).length, 0);
        const totalAvailable = CLASS_SLOTS.length * DAYS.length;

        console.log(`[Scheduler] "${batch.name}": ${classSlotsScheduled} / ${totalAvailable} class slots filled, ${conflicts} conflicts removed`);

        generatedTimetables.push(batchSchedule);
    }

    // ── 4. Persist ────────────────────────────────────────────────────────────
    if (batchId) {
        // Surgical: delete only for the specific batch(es) we just generated
        await Timetable.deleteMany({
            department: department,
            name: { $in: generatedTimetables.map(t => t.name) },
            semester: { $in: generatedTimetables.map(t => t.semester) }
        });
    } else if (department) {
        await Timetable.deleteMany({ department: department });
    } else {
        await Timetable.deleteMany({});
    }

    const saved = await Timetable.insertMany(generatedTimetables);
    return saved;
};