import Timetable from "../models/Timetable.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import Classroom from "../models/Classroom.js";
import { generateSchedule } from "../services/scheduler.js";

/* ─── GET /api/timetables ─────────────────────────────────────
   ADMIN        → sees ALL timetables (for moderation)
   COORDINATOR  → sees their department's timetables (all statuses)
   FACULTY      → sees only APPROVED timetables for their department
──────────────────────────────────────────────────────────────── */
export const getTimetables = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === "FACULTY") {
            if (!req.user.department) return res.status(200).json([]);
            query.department = req.user.department;
            query.status = "APPROVED";                // faculty sees approved only
        } else if (req.user.role === "COORDINATOR") {
            if (!req.user.department) return res.status(200).json([]);
            query.department = req.user.department;   // coordinator sees own dept (all statuses)
        }
        // ADMIN: no query filters → sees everything

        const timetables = await Timetable.find(query)
            .populate({ path: "schedule.slots.subject", select: "name codes type" })
            .populate({ path: "schedule.slots.faculty", select: "name department designation" })
            .populate({ path: "schedule.slots.classroom", select: "name capacity type" })
            .sort({ createdAt: -1 });

        res.status(200).json(timetables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─── PUT /api/timetables/:id  (admin or coordinator) ─────── */
export const updateTimetable = async (req, res) => {
    try {
        const { schedule } = req.body;
        const timetable = await Timetable.findById(req.params.id);
        if (!timetable) return res.status(404).json({ message: "Timetable not found" });

        // Coordinators can only update their own department's timetables
        if (req.user.role === "COORDINATOR" && timetable.department !== req.user.department) {
            return res.status(403).json({ message: "You can only edit timetables for your own department." });
        }

        // ─── CONFLICT DETECTION ─────────────────────────────────────
        const otherTimetables = await Timetable.find({ _id: { $ne: req.params.id } })
            .populate("schedule.slots.subject", "name")
            .populate("schedule.slots.faculty", "name")
            .populate("schedule.slots.classroom", "name");

        const conflicts = [];

        // Build a map of busy entities from other timetables
        // busyMap[day][time][entityId] = { entityName, batchName }
        const busyMap = {}; 

        otherTimetables.forEach(ot => {
            ot.schedule.forEach(daySch => {
                const day = daySch.day;
                if (!busyMap[day]) busyMap[day] = {};

                daySch.slots.forEach(slot => {
                    const time = slot.time;
                    if (!busyMap[day][time]) busyMap[day][time] = {};

                    if (slot.faculty) {
                        const fid = slot.faculty._id.toString();
                        busyMap[day][time][fid] = { name: slot.faculty.name, type: "Faculty", batch: ot.name };
                    }
                    if (slot.classroom) {
                        const rid = slot.classroom._id.toString();
                        busyMap[day][time][rid] = { name: slot.classroom.name, type: "Classroom", batch: ot.name };
                    }
                });
            });
        });

        // Check the new suggested schedule against the busyMap
        schedule.forEach(daySch => {
            const day = daySch.day;
            daySch.slots.forEach(slot => {
                const time = slot.time;
                if (!busyMap[day] || !busyMap[day][time]) return;

                if (slot.faculty) {
                    const fid = slot.faculty.toString();
                    if (busyMap[day][time][fid]) {
                        const conflict = busyMap[day][time][fid];
                        conflicts.push(`${conflict.type} Conflict: ${conflict.name} is already busy with "${conflict.batch}" on ${day} ${time}`);
                    }
                }
                if (slot.classroom) {
                    const rid = slot.classroom.toString();
                    if (busyMap[day][time][rid]) {
                        const conflict = busyMap[day][time][rid];
                        conflicts.push(`${conflict.type} Conflict: ${conflict.name} is already used by "${conflict.batch}" on ${day} ${time}`);
                    }
                }
            });
        });

        if (conflicts.length > 0) {
            return res.status(400).json({ 
                message: "Scheduling conflicts detected!", 
                conflicts 
            });
        }
        // ────────────────────────────────────────────────────────────

        timetable.schedule = schedule;
        timetable.version = (timetable.version || 1) + 1;
        
        await timetable.save();
        
        // Create Notification for Admin
        try {
            const editor = await User.findById(req.user.id).select("name");
            await Notification.create({
                recipientRole: "ADMIN",
                title: "Timetable Modified",
                message: `The timetable "${timetable.name}" for ${timetable.department} was modified by ${editor?.name || "a user"}.`
            });
        } catch (e) {
            console.error("Failed to create notification:", e);
        }
        
        // Populate and return the updated timetable
        const updatedTimetable = await Timetable.findById(req.params.id)
            .populate({ path: "schedule.slots.subject", select: "name codes type" })
            .populate({ path: "schedule.slots.faculty", select: "name department designation" })
            .populate({ path: "schedule.slots.classroom", select: "name capacity type" });

        res.status(200).json({ message: "Timetable updated successfully", data: updatedTimetable });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─── DELETE /api/timetables/:id  (admin or coordinator) ───── */
export const deleteTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.findById(req.params.id);
        if (!timetable) return res.status(404).json({ message: "Timetable not found" });

        // Coordinators can only delete their own department's timetables
        if (req.user.role === "COORDINATOR" && timetable.department !== req.user.department) {
            return res.status(403).json({ message: "You can only delete timetables for your own department." });
        }

        await timetable.deleteOne();
        res.status(200).json({ message: "Timetable deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─── PATCH /api/timetables/:id/approve  (admin only) ──────── */
export const approveTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.findByIdAndUpdate(
            req.params.id,
            {
                status: "APPROVED",
                approvedBy: req.user.id,
                approvalDate: new Date(),
                rejectionReason: null
            },
            { new: true }
        );
        if (!timetable) return res.status(404).json({ message: "Timetable not found" });
        res.status(200).json({ message: "Timetable approved successfully", timetable });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─── PATCH /api/timetables/:id/reject  (admin only) ───────── */
export const rejectTimetable = async (req, res) => {
    try {
        const { reason } = req.body;
        const timetable = await Timetable.findByIdAndUpdate(
            req.params.id,
            {
                status: "REJECTED",
                rejectionReason: reason || "No reason provided",
                approvedBy: null,
                approvalDate: null
            },
            { new: true }
        );
        if (!timetable) return res.status(404).json({ message: "Timetable not found" });
        res.status(200).json({ message: "Timetable rejected", timetable });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─── POST /api/timetables/save  (coordinator only) ────────── */
export const saveTimetable = async (req, res) => {
    try {
        const newTimetable = new Timetable({
            ...req.body,
            status: "PENDING_APPROVAL",   // always starts as pending
            generatedBy: req.user.id
        });
        await newTimetable.save();
        res.status(201).json(newTimetable);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* ─── POST /api/timetables/generate  (coordinator only) ────── */
export const generateTimetable = async (req, res) => {
    const { batchId, department } = req.body || {};
    if (!batchId) {
        return res.status(400).json({ message: "Please select a batch to generate the timetable." });
    }
    try {
        const timetables = await generateSchedule({
            batchId,
            department,
            generatedBy: req.user.id
        });
        res.status(200).json({ message: "Timetable generated successfully", data: timetables });
    } catch (error) {
        console.error("Error generating timetable:", error);
        res.status(500).json({ message: error.message });
    }
};
