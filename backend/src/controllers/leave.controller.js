import LeaveRequest from "../models/LeaveRequest.js";
import { resolveLeaveConflicts, applyResolution } from "../services/leaveConflictResolver.js";

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

/* Coordinator: Get leave with conflict details */
export const getLeaveWithConflicts = async (req, res) => {
    try {
        const { id } = req.params;

        const leave = await LeaveRequest.findById(id)
            .populate("faculty", "name email department")
            .populate("processedBy", "name email")
            .populate({
                path: "conflictResolution.conflicts.subject",
                model: "Subject"
            })
            .populate({
                path: "conflictResolution.conflicts.classroom",
                model: "Classroom"
            })
            .populate({
                path: "conflictResolution.resolutions.suggestions.details.id",
                model: "Faculty",
                select: "name email designation"
            });

        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        // RBAC Check
        if (req.user.role === "COORDINATOR" && req.user.department !== leave.department) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.status(200).json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* Coordinator: Apply a specific suggestion to resolve a conflict */
export const applyConflictSuggestion = async (req, res) => {
    try {
        const { leaveId, resolutionIndex, suggestionIndex } = req.body;

        const leave = await LeaveRequest.findById(leaveId);
        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        // RBAC Check
        if (req.user.role === "COORDINATOR" && req.user.department !== leave.department) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!leave.conflictResolution || !leave.conflictResolution.resolutions[resolutionIndex]) {
            return res.status(400).json({ message: "Invalid resolution index" });
        }

        const resolution = leave.conflictResolution.resolutions[resolutionIndex];
        if (!resolution.suggestions[suggestionIndex]) {
            return res.status(400).json({ message: "Invalid suggestion index" });
        }

        const suggestion = resolution.suggestions[suggestionIndex];

        // Apply the resolution
        const success = await applyResolution(
            suggestion.type,
            resolution.conflict,
            suggestion.details
        );

        if (!success) {
            return res.status(400).json({ message: "Failed to apply resolution" });
        }

        // Update the leave with applied suggestion
        suggestion.status = "APPLIED";
        suggestion.appliedAt = new Date();
        resolution.resolvedSuggestionIndex = suggestionIndex;

        await leave.save();

        res.status(200).json({
            message: "Conflict suggestion applied successfully",
            data: leave.conflictResolution.resolutions[resolutionIndex]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, applySuggestions } = req.body;

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

        // If approving, resolve conflicts
        if (status === "APPROVED") {
            try {
                console.log(`[updateLeaveStatus] Resolving conflicts for faculty ${leave.faculty} on date ${leave.date}`);
                const conflicts = await resolveLeaveConflicts(leave.faculty.toString(), leave.date);
                console.log(`[updateLeaveStatus] Conflict resolution result:`, conflicts);
                leave.conflictResolution = conflicts;

                // Optionally apply suggestions automatically
                if (applySuggestions && Array.isArray(applySuggestions)) {
                    for (const suggestion of applySuggestions) {
                        const success = await applyResolution(
                            suggestion.resolutionType,
                            suggestion.conflictData,
                            suggestion.suggestionData
                        );

                        if (success) {
                            // Mark the suggestion as applied
                            const resolution = leave.conflictResolution.resolutions.find(
                                r => r.conflict.timetableId.toString() === suggestion.conflictData.timetableId.toString() &&
                                     r.conflict.time === suggestion.conflictData.time
                            );

                            if (resolution) {
                                const suggestionIndex = applySuggestions.indexOf(suggestion);
                                resolution.resolvedSuggestionIndex = suggestionIndex;
                                resolution.suggestions[suggestionIndex].appliedAt = new Date();
                                resolution.suggestions[suggestionIndex].status = "APPLIED";
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error resolving conflicts:", error.message, error.stack);
                // Continue with leave approval even if conflict resolution fails
                leave.conflictResolution = {
                    hasConflicts: false,
                    conflicts: [],
                    resolutions: [],
                    error: error.message
                };
            }
        } else {
            // For REJECTED leaves, no conflict resolution needed
            leave.conflictResolution = {
                hasConflicts: false,
                conflicts: [],
                resolutions: []
            };
        }

        await leave.save();
        res.status(200).json({
            message: `Leave ${status.toLowerCase()} successfully`,
            data: leave,
            conflicts: leave.conflictResolution
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
