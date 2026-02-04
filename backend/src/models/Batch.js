import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "CSE Sem-3 Group-1"
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true }, // e.g., "A", "B"
    studentGroup: {
        type: Number,
        required: true,
        min: 1,
        max: 4 // Each department has 4 student groups
    },
    studentsCount: { type: Number, required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    coordinator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Reference to COORDINATOR user
    }
}, { timestamps: true });

export default mongoose.model("Batch", batchSchema);
