import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Review 2026"
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true }, // e.g., "A", "B"
    studentsCount: { type: Number, required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }]
}, { timestamps: true });

export default mongoose.model("Batch", batchSchema);
