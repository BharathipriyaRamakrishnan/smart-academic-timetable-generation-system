import mongoose from "mongoose";

/**
 * Exact institutional daily schedule — used as fixedPeriods default.
 * These are added automatically to any existing Settings document that
 * doesn't have them yet (migration-safe).
 */
export const INSTITUTIONAL_PERIODS = [
    { start: "08:45", end: "09:35", type: "Class",  label: "Period 1" },
    { start: "09:35", end: "10:25", type: "Class",  label: "Period 2" },
    { start: "10:25", end: "10:40", type: "Break",  label: "Break" },
    { start: "10:40", end: "11:35", type: "Class",  label: "Period 3" },
    { start: "11:35", end: "12:20", type: "Class",  label: "Period 4" },
    { start: "12:20", end: "13:30", type: "Lunch",  label: "Lunch Break" },
    { start: "13:30", end: "14:10", type: "Class",  label: "Period 5" },
    { start: "14:10", end: "15:10", type: "Class",  label: "Period 6" },
    { start: "15:10", end: "15:25", type: "Break",  label: "Break" },
    { start: "15:25", end: "16:30", type: "Class",  label: "Period 7" },
];

const periodSlotSchema = new mongoose.Schema({
    start: String,
    end:   String,
    type:  { type: String, enum: ["Class", "Break", "Lunch", "Free"], default: "Class" },
    label: String,
}, { _id: false });

const settingsSchema = new mongoose.Schema({
    workingDays: {
        type: Number, required: true, default: 6, min: 1, max: 7
    },
    startTime: {
        type: String, required: true, default: "08:45"
    },
    endTime: {
        type: String, required: true, default: "16:30"
    },
    periodDuration: {
        type: Number, required: true, default: 50
    },

    // ── Explicit period definitions (used by scheduler instead of auto-computing) ──
    // Each entry is one row in the daily schedule, including breaks/free periods.
    // If this array is empty, the scheduler falls back to auto-computation from
    // startTime + periodDuration + break windows.
    fixedPeriods: {
        type: [periodSlotSchema],
        default: () => INSTITUTIONAL_PERIODS,
    },

    // Break windows (kept for backward compat and Settings form display)
    morningBreak: {
        startTime: { type: String, default: "10:25" },
        endTime:   { type: String, default: "10:40" }
    },
    lunchBreak: {
        startTime: { type: String, default: "12:20" },
        endTime:   { type: String, default: "13:30" }
    },
    eveningBreak: {
        startTime: { type: String, default: "15:10" },
        endTime:   { type: String, default: "15:25" }
    },
    breaks: [{
        startTime: String,
        endTime:   String,
        name:      { type: String, default: "Break" }
    }],

    // Free periods — times where no classes are scheduled (used if fixedPeriods is empty)
    freePeriods: {
        type:    [String],
        default: ["10:40-11:35"]
    },

    // Faculty constraints
    maxClassesPerWeek:       { type: Number, default: 18 },
    maxClassesPerDayFaculty: { type: Number, default: 4 },

    // Batch constraints
    maxClassesPerDayBatch:   { type: Number, default: 7 },
    maxSubjectRepeatPerDay:  { type: Number, default: 2 },
    maxContinuousClasses:    { type: Number, default: 3 },

    // Lab
    labMinDuration:  { type: Number, default: 2 },
    sharedFaculty:   { type: Boolean, default: false }

}, { timestamps: true });

/**
 * getSettings — returns the singleton Settings document.
 * If no document exists, creates one with institutional defaults.
 * If a document exists but is missing new fields (e.g. fixedPeriods),
 * those fields are added automatically (migration-safe).
 */
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();

    if (!settings) {
        // Brand-new install — create with all defaults
        return await this.create({});
    }

    // ── Migration: ensure new fields exist on older documents ──
    let dirty = false;

    if (!settings.fixedPeriods || settings.fixedPeriods.length === 0) {
        settings.fixedPeriods = INSTITUTIONAL_PERIODS;
        dirty = true;
    }

    // Migration: convert stale 'Free' Period 3 to 'Class' so students
    // are always assigned a real subject instead of a self-study slot.
    const freeP3 = settings.fixedPeriods.find(
        p => p.start === "10:40" && p.end === "11:35" && p.type === "Free"
    );
    if (freeP3) {
        freeP3.type  = "Class";
        freeP3.label = "Period 3";
        dirty = true;
    }
    if (!settings.maxClassesPerDayFaculty) {
        settings.maxClassesPerDayFaculty = 4;
        dirty = true;
    }
    if (!settings.maxClassesPerDayBatch || settings.maxClassesPerDayBatch < 7) {
        settings.maxClassesPerDayBatch = 7;  // match 7 class slots per day
        dirty = true;
    }
    if (!settings.maxSubjectRepeatPerDay) {
        settings.maxSubjectRepeatPerDay = 2;
        dirty = true;
    }
    // Fix obviously-wrong old defaults
    if (settings.startTime === "09:00") {
        settings.startTime   = "08:45";
        settings.endTime     = "16:30";
        settings.periodDuration = 50;
        settings.workingDays = 6;
        settings.morningBreak = { startTime: "10:25", endTime: "10:40" };
        settings.lunchBreak   = { startTime: "12:20", endTime: "13:30" };
        settings.eveningBreak = { startTime: "15:10", endTime: "15:25" };
        dirty = true;
    }

    if (dirty) {
        await settings.save();
        console.log("[Settings] Migrated settings document to institutional defaults");
    }

    return settings;
};

export default mongoose.model("Settings", settingsSchema);
