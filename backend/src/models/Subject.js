import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    credits: { type: Number, required: true },
    type: { type: String, enum: ["Core", "Elective", "Lab"], required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    lecturesPerWeek: { type: Number, required: true },
    labsPerWeek: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Subject", subjectSchema);
