import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipientRole: { type: String, enum: ["ADMIN", "COORDINATOR", "FACULTY"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
