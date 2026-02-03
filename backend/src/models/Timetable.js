import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "CSE - Sem 3 - Section A"
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String },
    schedule: [{
        day: { type: String, required: true },
        slots: [{
            time: { type: String, required: true },
            subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
            faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
            classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
            type: { type: String, enum: ["Lecture", "Lab", "Break"] }
        }]
    }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Timetable", timetableSchema);
