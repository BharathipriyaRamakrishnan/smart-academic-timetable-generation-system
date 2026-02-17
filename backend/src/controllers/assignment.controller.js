import FacultySubjectAssignment from "../models/FacultySubjectAssignment.js";

/* Get all assignments for a department */
export const getAssignments = async (req, res) => {
    try {
        const { department } = req.params;

        const assignments = await FacultySubjectAssignment.find({
            department,
            status: "ACTIVE"
        })
            .populate("subject", "name codes type")
            .populate("faculty", "name email")
            .populate("assignedBy", "name email");

        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Get assignments for a specific student group */
export const getGroupAssignments = async (req, res) => {
    try {
        const { department, semester, studentGroup } = req.params;

        const assignments = await FacultySubjectAssignment.find({
            department,
            semester: parseInt(semester),
            studentGroup: parseInt(studentGroup),
            status: "ACTIVE"
        })
            .populate("subject", "name codes type lecturesPerWeek")
            .populate("faculty", "name email department");

        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Create faculty-subject assignment (Coordinator only) */
export const createAssignment = async (req, res) => {
    try {
        const { department, semester, studentGroup, subject, faculty, availability } = req.body;

        // Verify coordinator is managing this department
        if (req.user.role === "COORDINATOR" && req.user.coordinatorOf !== department) {
            return res.status(403).json({
                message: "You can only create assignments for your own department"
            });
        }

        // Deactivate existing assignment for this subject and student group
        await FacultySubjectAssignment.updateMany(
            { department, semester, studentGroup, subject, status: "ACTIVE" },
            { status: "INACTIVE" }
        );

        // Create new assignment
        const assignment = new FacultySubjectAssignment({
            department,
            semester,
            studentGroup,
            subject,
            faculty,
            assignedBy: req.user.id,
            availability,
            status: "ACTIVE"
        });

        await assignment.save();
        await assignment.populate("subject", "name code type");
        await assignment.populate("faculty", "name email");

        res.status(201).json({
            message: "Faculty assigned successfully",
            data: assignment
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* Update assignment (Coordinator only) */
export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const assignment = await FacultySubjectAssignment.findById(id);

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        // Verify coordinator is managing this department
        if (req.user.role === "COORDINATOR" && req.user.coordinatorOf !== assignment.department) {
            return res.status(403).json({
                message: "You can only update assignments for your own department"
            });
        }

        Object.assign(assignment, updates);
        await assignment.save();
        await assignment.populate("subject", "name code type");
        await assignment.populate("faculty", "name email");

        res.status(200).json({
            message: "Assignment updated successfully",
            data: assignment
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* Delete assignment (Coordinator only) */
export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await FacultySubjectAssignment.findById(id);

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        // Verify coordinator is managing this department
        if (req.user.role === "COORDINATOR" && req.user.coordinatorOf !== assignment.department) {
            return res.status(403).json({
                message: "You can only delete assignments for your own department"
            });
        }

        assignment.status = "INACTIVE";
        await assignment.save();

        res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
