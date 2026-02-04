import AcademicCalendar from "../models/AcademicCalendar.js";

/* Get all calendars */
export const getCalendars = async (req, res) => {
    try {
        const calendars = await AcademicCalendar.find().sort({ academicYear: -1, semester: -1 });
        res.status(200).json(calendars);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Get calendar by year and semester */
export const getCalendar = async (req, res) => {
    try {
        const { year, semester } = req.params;

        const calendar = await AcademicCalendar.findOne({
            academicYear: year,
            semester: parseInt(semester)
        });

        if (!calendar) {
            return res.status(404).json({ message: "Calendar not found" });
        }

        res.status(200).json(calendar);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Create academic calendar (Admin only) */
export const createCalendar = async (req, res) => {
    try {
        const calendarData = req.body;

        // Check if calendar already exists
        const existing = await AcademicCalendar.findOne({
            academicYear: calendarData.academicYear,
            semester: calendarData.semester
        });

        if (existing) {
            return res.status(400).json({
                message: "Calendar already exists for this year and semester"
            });
        }

        const calendar = new AcademicCalendar(calendarData);
        await calendar.save();

        res.status(201).json({
            message: "Academic calendar created successfully",
            data: calendar
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* Update academic calendar (Admin only) */
export const updateCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const calendar = await AcademicCalendar.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!calendar) {
            return res.status(404).json({ message: "Calendar not found" });
        }

        res.status(200).json({
            message: "Calendar updated successfully",
            data: calendar
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* Delete academic calendar (Admin only) */
export const deleteCalendar = async (req, res) => {
    try {
        const { id } = req.params;

        const calendar = await AcademicCalendar.findByIdAndDelete(id);

        if (!calendar) {
            return res.status(404).json({ message: "Calendar not found" });
        }

        res.status(200).json({ message: "Calendar deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Get active calendar for current semester */
export const getActiveCalendar = async (req, res) => {
    try {
        const now = new Date();

        const calendar = await AcademicCalendar.findOne({
            startDate: { $lte: now },
            endDate: { $gte: now },
            isActive: true
        });

        if (!calendar) {
            return res.status(404).json({ message: "No active calendar found" });
        }

        res.status(200).json(calendar);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
