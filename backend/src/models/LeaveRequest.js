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
    }
}, { timestamps: true });

// Ensure unique leave request per faculty per date
leaveRequestSchema.index({ faculty: 1, date: 1 }, { unique: true });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
