import Timetable from "../models/Timetable.js";
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

/* ─── DELETE /api/timetables/:id  (admin only) ─────────────── */
export const deleteTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.findByIdAndDelete(req.params.id);
        if (!timetable) return res.status(404).json({ message: "Timetable not found" });
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
