import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    designation: { type: String },
    maxLoad: { type: Number, default: 12 }, // Max hours per week
    unavailableSlots: [{
        day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
        time: { type: String } // e.g., "09:00-10:00"
    }],
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }], // Subjects the faculty can teach
    preferredSemesters: [{ type: Number }] // e.g., [1, 2, 3] for junior subjects
}, { timestamps: true });

export default mongoose.model("Faculty", facultySchema);
