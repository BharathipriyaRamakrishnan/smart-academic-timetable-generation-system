import Constraint from "../models/Constraint.js";

/* Get global constraints */
export const getGlobalConstraints = async (req, res) => {
    try {
        const globalConstraints = await Constraint.findOne({
            type: "GLOBAL",
            status: "ACTIVE"
        }).populate("createdBy", "name email");

        if (!globalConstraints) {
            return res.status(404).json({ message: "Global constraints not configured yet" });
        }

        res.status(200).json(globalConstraints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Create or update global constraints (Admin only) */
export const setGlobalConstraints = async (req, res) => {
    try {
        const { constraints } = req.body;

        // Deactivate existing global constraints
        await Constraint.updateMany(
            { type: "GLOBAL", status: "ACTIVE" },
            { status: "INACTIVE" }
        );

        // Create new global constraints
        const newConstraints = new Constraint({
            type: "GLOBAL",
            department: null,
            constraints,
            createdBy: req.user.id,
            status: "ACTIVE"
        });

        await newConstraints.save();
        res.status(201).json({
            message: "Global constraints set successfully",
            data: newConstraints
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* Get department constraints */
export const getDepartmentConstraints = async (req, res) => {
    try {
        const { department } = req.params;

        const deptConstraints = await Constraint.findOne({
            type: "DEPARTMENT",
            department,
            status: "ACTIVE"
        }).populate("createdBy", "name email");

        if (!deptConstraints) {
            return res.status(404).json({ message: "Department constraints not configured yet" });
        }

        res.status(200).json(deptConstraints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Create or update department constraints (Coordinator only) */
export const setDepartmentConstraints = async (req, res) => {
    try {
        const { department, constraints } = req.body;

        // Verify coordinator is managing this department
        if (req.user.role === "COORDINATOR" && req.user.coordinatorOf !== department) {
            return res.status(403).json({
                message: "You can only set constraints for your own department"
            });
        }

        // Deactivate existing department constraints
        await Constraint.updateMany(
            { type: "DEPARTMENT", department, status: "ACTIVE" },
            { status: "INACTIVE" }
        );

        // Create new department constraints
        const newConstraints = new Constraint({
            type: "DEPARTMENT",
            department,
            constraints,
            createdBy: req.user.id,
            status: "ACTIVE"
        });

        await newConstraints.save();
        res.status(201).json({
            message: "Department constraints set successfully",
            data: newConstraints
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* Get all constraints (global + department) */
export const getAllConstraints = async (req, res) => {
    try {
        const { department } = req.query;

        const query = { status: "ACTIVE" };
        if (department) {
            query.$or = [
                { type: "GLOBAL" },
                { type: "DEPARTMENT", department }
            ];
        }

        const constraints = await Constraint.find(query)
            .populate("createdBy", "name email")
            .sort({ type: 1 }); // Global first, then department

        res.status(200).json(constraints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
