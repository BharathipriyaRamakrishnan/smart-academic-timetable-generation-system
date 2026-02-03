import Timetable from "../models/Timetable.js";

export const getTimetables = async (req, res) => {
    try {
        const timetables = await Timetable.find();
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

// Placeholder for generation logic
export const generateTimetable = async (req, res) => {
    try {
        const timetables = await generateSchedule();
        res.status(200).json({ message: "Timetables generated successfully", data: timetables });
    } catch (error) {
        console.error("Error generating timetable:", error);
        res.status(500).json({ message: error.message });
    }
};
