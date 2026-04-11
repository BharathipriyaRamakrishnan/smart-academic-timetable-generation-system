import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema({
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    department: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING"
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Coordinator who approved/rejected
    },
    processedAt: {
        type: Date
    },
    conflictResolution: {
        hasConflicts: {
            type: Boolean,
            default: false
        },
        conflictCount: {
            type: Number,
            default: 0
        },
        weekday: {
            type: String
        },
        conflicts: [{
            timetableId: mongoose.Schema.Types.ObjectId,
            timetableName: String,
            day: String,
            time: String,
            subject: mongoose.Schema.Types.ObjectId,
            classroom: mongoose.Schema.Types.ObjectId,
            type: String
        }],
        resolutions: [{
            conflict: {
                timetableId: mongoose.Schema.Types.ObjectId,
                timetableName: String,
                day: String,
                time: String,
                subject: mongoose.Schema.Types.ObjectId,
                classroom: mongoose.Schema.Types.ObjectId,
                type: String
            },
            suggestions: [{
                type: String, // FACULTY_REPLACEMENT, SLOT_RESCHEDULING, MANUAL_RESOLUTION
                priority: Number,
                description: String,
                details: mongoose.Schema.Types.Mixed,
                status: String,
                appliedAt: {
                    type: Date,
                    default: null
                }
            }],
            resolvedSuggestionIndex: {
                type: Number,
                default: null
            }
        }]
    }
}, { timestamps: true });

// Ensure unique leave request per faculty per date
leaveRequestSchema.index({ faculty: 1, date: 1 }, { unique: true });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
