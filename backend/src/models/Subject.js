import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    codes: [{ type: String, required: true }], // Changed from single code to array
    credits: { type: Number, required: true },
    type: { type: String, enum: ["Core", "Elective", "Lab"], required: true },
    departments: [{ type: String, required: true }], // Changed from single department to array
    semester: { type: Number, required: true },
    lecturesPerWeek: { type: Number, required: true },
    labsPerWeek: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Subject", subjectSchema);
