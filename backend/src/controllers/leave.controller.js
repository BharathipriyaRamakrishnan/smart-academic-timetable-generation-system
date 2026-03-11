import LeaveRequest from "../models/LeaveRequest.js";

/* Faculty: Submit a leave request */
export const createLeaveRequest = async (req, res) => {
    try {
        const { date, reason } = req.body;
        
        if (!date || !reason) {
            return res.status(400).json({ message: "Date and reason are required" });
        }

        const leaveDate = new Date(date);
        leaveDate.setHours(0, 0, 0, 0);

        // Check for existing request on same date
        const existing = await LeaveRequest.findOne({ faculty: req.user.id, date: leaveDate });
        if (existing) {
            return res.status(400).json({ message: "You already have a leave request for this date" });
        }

        const newLeave = new LeaveRequest({
            faculty: req.user.id,
            department: req.user.department,
            date: leaveDate,
            reason
        });

        await newLeave.save();
        res.status(201).json({ message: "Leave request submitted successfully", data: newLeave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Faculty: Get their own leave requests */
export const getMyLeaves = async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ faculty: req.user.id }).sort({ date: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Coordinator: Get leaves for their department */
export const getDepartmentLeaves = async (req, res) => {
    try {
        const { department } = req.params;
        
        // RBAC Check: Coordinators can only see their department
        if (req.user.role === "COORDINATOR" && req.user.department !== department) {
            return res.status(403).json({ message: "Access denied" });
        }

        const leaves = await LeaveRequest.find({ department })
            .populate("faculty", "name email")
            .sort({ date: -1 });
            
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Coordinator: Approve/Reject leave */
export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const leave = await LeaveRequest.findById(id);
        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        // RBAC Check: Coordinators can only process their department
        if (req.user.role === "COORDINATOR" && req.user.department !== leave.department) {
            return res.status(403).json({ message: "Access denied" });
        }

        leave.status = status;
        leave.processedBy = req.user.id;
        leave.processedAt = new Date();

        await leave.save();
        res.status(200).json({ message: `Leave ${status.toLowerCase()} successfully`, data: leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
