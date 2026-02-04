import mongoose from "mongoose";

const facultySubjectAssignmentSchema = new mongoose.Schema({
    department: {
        type: String,
        required: true
    },

    semester: {
        type: Number,
        required: true
    },

    studentGroup: {
        type: Number,
        required: true,
        min: 1,
        max: 4 // 4 groups per department
    },

    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },

    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
        required: true
    },

    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // HOD/Coordinator
        required: true
    },

    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE"
    },

    // Optional: Faculty availability for this assignment
    availability: [{
        day: String,
        slots: [String]
    }]
}, { timestamps: true });

// Ensure unique assignment: one faculty per subject per student group
facultySubjectAssignmentSchema.index(
    { department: 1, semester: 1, studentGroup: 1, subject: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);

export default mongoose.model("FacultySubjectAssignment", facultySubjectAssignmentSchema);
