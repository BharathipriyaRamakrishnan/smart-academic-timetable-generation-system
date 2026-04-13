import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    // Who should receive this notification
    recipientRole: { type: String, enum: ["ADMIN", "COORDINATOR", "FACULTY"], required: true },
    
    // Specific user (if null = broadcast to all of that role)
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Department context (for coordinator-scoped filtering)
    department: { type: String, default: null },

    // Notification type
    type: {
        type: String,
        enum: [
            "LEAVE_SUBMITTED",       // Faculty submitted leave → Coordinator
            "LEAVE_APPROVED",        // Leave approved → Faculty
            "LEAVE_REJECTED",        // Leave rejected → Faculty
            "TIMETABLE_UPDATE_NEEDED", // Conflicts exist after approval → Coordinator
            "SUBSTITUTION_ASSIGNED", // Faculty assigned as substitute → Faculty
            "TIMETABLE_MODIFIED",    // Generic timetable change → Admin
            "GENERAL"
        ],
        default: "GENERAL"
    },

    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },

    // Related resource links
    link: { type: String, default: null },
    leaveRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveRequest", default: null }
}, { timestamps: true });

// Index for fast queries
notificationSchema.index({ recipientRole: 1, recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
