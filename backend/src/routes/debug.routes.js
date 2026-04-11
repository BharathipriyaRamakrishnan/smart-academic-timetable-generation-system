// Debug endpoint to test conflict resolution
import express from "express";
import { getWeekdayFromDate, findConflictingSlots } from "../services/leaveConflictResolver.js";
import Timetable from "../models/Timetable.js";
import Faculty from "../models/Faculty.js";

const router = express.Router();

// Debug: Check what timetables exist
router.get("/debug/timetables", async (req, res) => {
    try {
        const timetables = await Timetable.find({ status: "PUBLISHED" })
            .select("name status department semester schedule");
        
        console.log(`[Debug] Found ${timetables.length} published timetables`);
        
        res.status(200).json({
            count: timetables.length,
            timetables: timetables.map(t => ({
                id: t._id,
                name: t.name,
                department: t.department,
                semester: t.semester,
                status: t.status,
                daysHaveSchedule: t.schedule.map(s => s.day)
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Debug: Check a specific faculty's classes
router.get("/debug/faculty/:facultyId/classes", async (req, res) => {
    try {
        const { facultyId } = req.params;
        const dayName = req.query.day || "Friday";
        
        console.log(`[Debug] Checking faculty ${facultyId} on ${dayName}`);
        
        const timetables = await Timetable.find({ status: "PUBLISHED" })
            .populate("schedule.slots.faculty", "name")
            .populate("schedule.slots.subject", "name");
        
        let classes = [];
        for (const timetable of timetables) {
            const schedule = timetable.schedule.find(s => s.day === dayName);
            if (!schedule) continue;
            
            const facultyClasses = schedule.slots.filter(slot => {
                if (!slot.faculty) return false;
                return slot.faculty._id.toString() === facultyId;
            });
            
            classes.push({
                timetable: timetable.name,
                classes: facultyClasses.map(c => ({
                    time: c.time,
                    subject: c.subject?.name || "Unknown",
                    type: c.type
                }))
            });
        }
        
        res.status(200).json({
            faculty: facultyId,
            day: dayName,
            classes: classes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Debug: Check what date converts to
router.get("/debug/weekday/:date", async (req, res) => {
    try {
        const { date } = req.params;
        const weekday = getWeekdayFromDate(new Date(date));
        
        res.status(200).json({
            inputDate: date,
            parsedDate: new Date(date).toISOString(),
            weekday: weekday
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Debug: Search for a faculty by name
router.get("/debug/faculty-by-name/:name", async (req, res) => {
    try {
        const { name } = req.params;
        const faculty = await Faculty.find({ 
            name: { $regex: name, $options: "i" } 
        }).select("_id name email department");
        
        res.status(200).json({
            search: name,
            results: faculty
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
