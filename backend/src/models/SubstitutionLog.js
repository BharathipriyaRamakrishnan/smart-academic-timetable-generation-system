import mongoose from "mongoose";

const substitutionLogSchema = new mongoose.Schema({
    // The leave request that triggered this substitution
    leaveRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LeaveRequest",
        required: true
    },

    // Timetable being modified
    timetableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Timetable",
        required: true
    },
    timetableName: { type: String, required: true },

    // Slot details
    day: { type: String, required: true },
    time: { type: String, required: true },

    // Subject and classroom at the time of substitution
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String },
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
    classroomName: { type: String },

    // Faculty on leave (original)
    originalFacultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
        required: true
    },
    originalFacultyName: { type: String, required: true },

    // Replacement faculty
    substituteFacultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
        required: true
    },
    substituteFacultyName: { type: String, required: true },

    // Who made this assignment
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Department context
    department: { type: String, required: true },

    // Leave date for easy display
    leaveDate: { type: Date, required: true },

    // Status of this substitution
    status: {
        type: String,
        enum: ["ACTIVE", "REVERTED"],
        default: "ACTIVE"
    },

    revertedAt: { type: Date, default: null },
    revertedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

// Index for fast lookups
substitutionLogSchema.index({ leaveRequestId: 1 });
substitutionLogSchema.index({ department: 1, leaveDate: -1 });
substitutionLogSchema.index({ substituteFacultyId: 1 });

export default mongoose.model("SubstitutionLog", substitutionLogSchema);
