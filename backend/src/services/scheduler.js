import Classroom from "../models/Classroom.js";
import Faculty from "../models/Faculty.js";
import Subject from "../models/Subject.js";
import Batch from "../models/Batch.js";
import Timetable from "../models/Timetable.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
    "09:00-10:00",
    "10:00-11:00",
    "11:00-11:15", // Break
    "11:15-12:15",
    "12:15-01:15",
    "01:15-02:00", // Lunch
    "02:00-03:00",
    "03:00-04:00",
];

export const generateSchedule = async () => {
    // 1. Fetch all resources
    const batches = await Batch.find().populate("subjects");
    const classrooms = await Classroom.find();
    const faculties = await Faculty.find();

    // 2. Initialize tracking structures
    // Map to track allocations: [Day][Time][ResourceId] = true/false
    const scheduleMap = {
        classrooms: {},
        faculty: {},
        batches: {},
    };

    const generatedTimetables = [];

    // Helper to check availability
    const isAvailable = (day, time, batchId, facultyId, classroomId) => {
        if (scheduleMap.batches[batchId]?.[day]?.[time]) return false;
        if (scheduleMap.faculty[facultyId]?.[day]?.[time]) return false;
        if (scheduleMap.classrooms[classroomId]?.[day]?.[time]) return false;
        return true;
    };

    // Helper to mark booked
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
    };

    // 3. Scheduling Logic
    for (const batch of batches) {
        const batchSchedule = {
            name: batch.name,
            department: batch.department,
            semester: batch.semester,
            section: batch.section,
            schedule: [],
        };

        // Initialize days for this batch
        DAYS.forEach((day) => {
            batchSchedule.schedule.push({ day, slots: [] });
        });

        for (const subject of batch.subjects) {
            let classesToSchedule = subject.lecturesPerWeek;

            // Find a faculty for this subject (Simple: First available with department match or just assume passed in req? 
            // For now, let's find a faculty who can teach this subject. 
            // Assumption: Faculty model needs a way to link to subjects. 
            // The current Faculty model has 'department', but not specific subjects. 
            // We will pick a faculty from the same department.)

            const eligibleFaculties = faculties.filter(f => f.department === subject.department);
            if (eligibleFaculties.length === 0) continue; // Skip if no faculty found

            // Round robin or random faculty assignment for load check could be added
            const assignedFaculty = eligibleFaculties[0]; // Simplified

            // Find a classroom (Simplified: First matching capacity)
            const eligibleClassrooms = classrooms.filter(c => c.capacity >= batch.studentsCount && c.type === (subject.type === "Lab" ? "Laboratory" : "Lecture Hall"));
            if (eligibleClassrooms.length === 0) continue;
            const assignedClassroom = eligibleClassrooms[0]; // Simplified

            for (let i = 0; i < classesToSchedule; i++) {
                let scheduled = false;

                // Try to find a slot
                for (const day of DAYS) {
                    const daySchedule = batchSchedule.schedule.find(s => s.day === day);

                    for (const time of TIME_SLOTS) {
                        if (time.includes("Break") || time.includes("Lunch")) continue; // Skip breaks

                        if (isAvailable(day, time, batch._id, assignedFaculty._id, assignedClassroom._id)) {
                            // Check if slot is already filled in this batch's temporary schedule object (redundant check but safe)
                            const existingSlot = daySchedule.slots.find(s => s.time === time);
                            if (existingSlot) continue;

                            // Book it
                            bookSlot(day, time, batch._id, assignedFaculty._id, assignedClassroom._id);

                            daySchedule.slots.push({
                                time,
                                subject: subject._id,
                                faculty: assignedFaculty._id,
                                classroom: assignedClassroom._id,
                                type: subject.type
                            });

                            scheduled = true;
                            break;
                        }
                    }
                    if (scheduled) break;
                }
            }
        }

        // Sort slots by time
        batchSchedule.schedule.forEach(daySch => {
            daySch.slots.sort((a, b) => a.time.localeCompare(b.time));
        });

        generatedTimetables.push(batchSchedule);
    }

    // 4. Save generated timetables to DB
    // Clear old ones? Or just return? Let's return them.
    // Or save them.
    await Timetable.deleteMany({}); // Clear existing for now
    await Timetable.insertMany(generatedTimetables);

    return generatedTimetables;
};
