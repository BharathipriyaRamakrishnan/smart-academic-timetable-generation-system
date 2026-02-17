import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "CSE Sem-3 Group-1"
    department: { type: String, required: true },
    semester: { type: Number }, // Optional field
    section: { type: String }, // Optional field - e.g., "A", "B"
    studentGroup: {
        type: Number,
        min: 1,
        max: 4 // Each department has 4 student groups
    },
    studentsCount: { type: Number, required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }], // Optional field
    coordinator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Reference to COORDINATOR user
    }
}, { timestamps: true });

export default mongoose.model("Batch", batchSchema);
