import Timetable from "../models/Timetable.js";

export const getTimetables = async (req, res) => {
    try {
        let query = {};

        // FACULTY and COORDINATOR only see their own department's timetables
        if ((req.user.role === "FACULTY" || req.user.role === "COORDINATOR") && req.user.department) {
            query.department = req.user.department;
        }
        // ADMINs see all timetables (query stays empty)

        const timetables = await Timetable.find(query)
            .populate({
                path: "schedule.slots.subject",
                select: "name codes type"
            })
            .populate({
                path: "schedule.slots.faculty",
                select: "name department designation"
            })
            .populate({
                path: "schedule.slots.classroom",
                select: "name capacity type"
            });
        res.status(200).json(timetables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const saveTimetable = async (req, res) => {
    try {
        const newTimetable = new Timetable(req.body);
        await newTimetable.save();
        res.status(201).json(newTimetable);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

import { generateSchedule } from "../services/scheduler.js";

// Generate timetable — coordinator only, must specify a batch
export const generateTimetable = async (req, res) => {
    const { batchId, department } = req.body || {};

    if (!batchId) {
        return res.status(400).json({ message: "Please select a batch to generate the timetable." });
    }

    try {
        const timetables = await generateSchedule({ batchId, department });
        res.status(200).json({ message: "Timetable generated successfully", data: timetables });
    } catch (error) {
        console.error("Error generating timetable:", error);
        res.status(500).json({ message: error.message });
    }
};
