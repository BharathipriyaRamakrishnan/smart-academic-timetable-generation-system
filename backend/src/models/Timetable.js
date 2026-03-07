import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "CSE - Sem 3 - Group 1"
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String },
    studentGroup: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    },
    schedule: [{
        day: { type: String, required: true },
        slots: [{
            time: { type: String, required: true },
            subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
            faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
            classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
            type: { type: String, enum: ["Lecture", "Lab", "Break", "Lunch", "Free"] }
        }]
    }],

    // Workflow status
    status: {
        type: String,
        enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PUBLISHED"],
        default: "DRAFT"
    },

    version: {
        type: Number,
        default: 1
    },

    // Tracking
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // COORDINATOR who generated this
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // ADMIN who approved
    },

    rejectionReason: {
        type: String,
        default: null
    },

    approvalDate: {
        type: Date,
        default: null
    },

    publishedDate: {
        type: Date,
        default: null
    },

    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Timetable", timetableSchema);
