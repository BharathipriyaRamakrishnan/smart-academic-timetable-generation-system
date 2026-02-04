import mongoose from "mongoose";

const constraintSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["GLOBAL", "DEPARTMENT"],
        required: true
    },

    department: {
        type: String,
        default: null // null for GLOBAL constraints
    },

    constraints: {
        maxHoursPerFacultyPerWeek: {
            type: Number,
            default: 40
        },
        maxHoursPerFacultyPerDay: {
            type: Number,
            default: 8
        },
        workingDays: {
            type: [String],
            default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        },
        hoursPerDay: {
            type: Number,
            default: 8
        },
        breakTimes: [{
            start: String,
            end: String,
            name: String
        }],
        lunchTime: {
            start: String,
            end: String
        },
        preferredTimeSlots: [String],
        labDuration: {
            type: Number,
            default: 2 // hours
        },
        lectureDuration: {
            type: Number,
            default: 1 // hours
        }
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE"
    }
}, { timestamps: true });

// Ensure only one active global constraint exists
constraintSchema.index({ type: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { type: "GLOBAL", status: "ACTIVE" }
});

// Ensure only one active constraint per department
constraintSchema.index({ department: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { type: "DEPARTMENT", status: "ACTIVE" }
});

export default mongoose.model("Constraint", constraintSchema);
