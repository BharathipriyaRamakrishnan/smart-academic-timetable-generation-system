import mongoose from "mongoose";

const academicCalendarSchema = new mongoose.Schema({
    academicYear: {
        type: String,
        required: true // e.g., "2025-2026"
    },

    semester: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5, 6, 7, 8]
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    workingDays: {
        type: [String],
        default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },

    holidays: [{
        date: {
            type: Date,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ["PUBLIC", "INSTITUTIONAL", "OTHER"],
            default: "PUBLIC"
        }
    }],

    examDates: [{
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        },
        type: {
            type: String,
            enum: ["MID_TERM", "END_TERM", "INTERNAL"],
            required: true
        }
    }],

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Ensure unique calendar per academic year and semester
academicCalendarSchema.index({ academicYear: 1, semester: 1 }, { unique: true });

export default mongoose.model("AcademicCalendar", academicCalendarSchema);
