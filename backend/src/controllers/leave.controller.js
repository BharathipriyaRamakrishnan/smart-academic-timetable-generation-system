import LeaveRequest from "../models/LeaveRequest.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { resolveLeaveConflicts, applyResolution } from "../services/leaveConflictResolver.js";

/* ─────────────────────────────────────────────────────────────────
   Helper: Find the coordinator User for a given department
────────────────────────────────────────────────────────────────── */
const findDepartmentCoordinator = async (department) => {
    return await User.findOne({ role: "COORDINATOR", coordinatorOf: department });
};

/* ─────────────────────────────────────────────────────────────────
   FACULTY: Submit a leave request
────────────────────────────────────────────────────────────────── */
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

        // Notify the department coordinator
        try {
            const coordinator = await findDepartmentCoordinator(req.user.department);
            const facultyUser = await User.findById(req.user.id).select("name");

            if (coordinator) {
                await Notification.create({
                    recipientRole: "COORDINATOR",
                    recipientId: coordinator._id,
                    department: req.user.department,
                    type: "LEAVE_SUBMITTED",
                    title: "New Leave Request",
                    message: `${facultyUser?.name || "A faculty member"} has submitted a leave request for ${leaveDate.toDateString()}.`,
                    link: "/leave-management",
                    leaveRequestId: newLeave._id
                });
            }
        } catch (notifError) {
            console.error("Failed to create leave submission notification:", notifError);
        }

        res.status(201).json({ message: "Leave request submitted successfully", data: newLeave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   FACULTY: Get their own leave requests
────────────────────────────────────────────────────────────────── */
export const getMyLeaves = async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ faculty: req.user.id }).sort({ date: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   COORDINATOR/ADMIN: Get leaves for their department
────────────────────────────────────────────────────────────────── */
export const getDepartmentLeaves = async (req, res) => {
    try {
        const { department } = req.params;

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

/* ─────────────────────────────────────────────────────────────────
   COORDINATOR: Get approved leaves that still have unresolved conflicts
────────────────────────────────────────────────────────────────── */
export const getApprovedLeavesWithConflicts = async (req, res) => {
    try {
        const department = req.user.department;
        if (!department) return res.status(400).json({ message: "Department context required" });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const leaves = await LeaveRequest.find({
            department,
            status: "APPROVED",
            date: { $gte: today },
            "conflictResolution.hasConflicts": true
        })
        .populate("faculty", "name email department")
        .populate("processedBy", "name email")
        .sort({ date: 1 });

        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   COORDINATOR: Get a single leave with full conflict details
────────────────────────────────────────────────────────────────── */
export const getLeaveWithConflicts = async (req, res) => {
    try {
        const { id } = req.params;

        const leave = await LeaveRequest.findById(id)
            .populate("faculty", "name email department")
            .populate("processedBy", "name email");

        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        if (req.user.role === "COORDINATOR" && req.user.department !== leave.department) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.status(200).json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   COORDINATOR: Apply a specific suggestion to resolve a conflict
────────────────────────────────────────────────────────────────── */
export const applyConflictSuggestion = async (req, res) => {
    try {
        const { leaveId, resolutionIndex, suggestionIndex } = req.body;

        const leave = await LeaveRequest.findById(leaveId);
        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

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

        const success = await applyResolution(
            suggestion.type,
            resolution.conflict,
            suggestion.details
        );

        if (!success) {
            return res.status(400).json({ message: "Failed to apply resolution" });
        }

        suggestion.status = "APPLIED";
        suggestion.appliedAt = new Date();
        resolution.resolvedSuggestionIndex = suggestionIndex;

        leave.markModified("conflictResolution");
        await leave.save();

        res.status(200).json({
            message: "Conflict suggestion applied successfully",
            data: leave.conflictResolution.resolutions[resolutionIndex]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   COORDINATOR: Approve or Reject a leave request
────────────────────────────────────────────────────────────────── */
export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, applySuggestions } = req.body;

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const leave = await LeaveRequest.findById(id).populate("faculty", "name email");
        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        if (req.user.role === "COORDINATOR" && req.user.department !== leave.department) {
            return res.status(403).json({ message: "Access denied" });
        }

        leave.status = status;
        leave.processedBy = req.user.id;
        leave.processedAt = new Date();

        if (status === "APPROVED") {
            try {
                console.log(`[updateLeaveStatus] Resolving conflicts for faculty ${leave.faculty} on ${leave.date}`);
                const conflicts = await resolveLeaveConflicts(leave.faculty._id.toString(), leave.date);
                console.log(`[updateLeaveStatus] Conflict resolution result:`, JSON.stringify({
                    hasConflicts: conflicts.hasConflicts,
                    conflictCount: conflicts.conflictCount,
                    weekday: conflicts.weekday,
                    numConflicts: conflicts.conflicts?.length,
                    numResolutions: conflicts.resolutions?.length
                }));

                // Only store schema-valid fields — strip allAlternatives, note, etc.
                leave.conflictResolution = {
                    hasConflicts: !!conflicts.hasConflicts,
                    conflictCount: conflicts.conflictCount || 0,
                    weekday: conflicts.weekday || null,
                    conflicts: (conflicts.conflicts || []).map(c => ({
                        timetableId: c.timetableId,
                        timetableName: c.timetableName,
                        day: c.day,
                        time: c.time,
                        // Denormalize subject & classroom — store both id and name
                        subject: c.subject
                            ? { _id: c.subject._id || c.subject, name: c.subject.name || null }
                            : null,
                        classroom: c.classroom
                            ? { _id: c.classroom._id || c.classroom, name: c.classroom.name || null }
                            : null,
                        type: c.type
                    })),
                    resolutions: (conflicts.resolutions || []).map(r => ({
                        conflict: {
                            timetableId: r.conflict?.timetableId,
                            timetableName: r.conflict?.timetableName,
                            day: r.conflict?.day,
                            time: r.conflict?.time,
                            subject: r.conflict?.subject
                                ? { _id: r.conflict.subject._id || r.conflict.subject, name: r.conflict.subject.name || null }
                                : null,
                            classroom: r.conflict?.classroom
                                ? { _id: r.conflict.classroom._id || r.conflict.classroom, name: r.conflict.classroom.name || null }
                                : null,
                            type: r.conflict?.type
                        },
                        suggestions: (r.suggestions || []).map(s => ({
                            type: s.type,
                            priority: s.priority,
                            description: s.description,
                            details: {
                                ...(s.details || {}),
                                allAlternatives: s.allAlternatives || []
                            },
                            status: s.status || "AVAILABLE",
                            appliedAt: s.appliedAt || null
                        }))
                    }))
                };

                // Auto-apply suggestions if provided
                if (applySuggestions && Array.isArray(applySuggestions)) {
                    for (const suggestion of applySuggestions) {
                        const success = await applyResolution(
                            suggestion.resolutionType,
                            suggestion.conflictData,
                            suggestion.suggestionData
                        );
                        if (success) {
                            const resolution = leave.conflictResolution.resolutions.find(
                                r => r.conflict.timetableId?.toString() === suggestion.conflictData.timetableId?.toString() &&
                                     r.conflict.time === suggestion.conflictData.time
                            );
                            if (resolution) {
                                const sIdx = applySuggestions.indexOf(suggestion);
                                resolution.resolvedSuggestionIndex = sIdx;
                                if (resolution.suggestions[sIdx]) {
                                    resolution.suggestions[sIdx].appliedAt = new Date();
                                    resolution.suggestions[sIdx].status = "APPLIED";
                                }
                            }
                        }
                    }
                }

                // ── Send notifications ──────────────────────────────────────
                // 1. Notify the faculty their leave was approved
                try {
                    await Notification.create({
                        recipientRole: "FACULTY",
                        recipientId: leave.faculty._id,
                        department: leave.department,
                        type: "LEAVE_APPROVED",
                        title: "Leave Request Approved",
                        message: `Your leave request for ${new Date(leave.date).toDateString()} has been approved.`,
                        link: "/leaves",
                        leaveRequestId: leave._id
                    });
                } catch (notifErr) {
                    console.error("Failed to create leave-approved notification:", notifErr.message);
                }

                // 2. If conflicts exist, notify the coordinator to update timetable
                if (conflicts.hasConflicts) {
                    try {
                        const coordinator = await findDepartmentCoordinator(leave.department);
                        if (coordinator) {
                            await Notification.create({
                                recipientRole: "COORDINATOR",
                                recipientId: coordinator._id,
                                department: leave.department,
                                type: "TIMETABLE_UPDATE_NEEDED",
                                title: "⚠️ Timetable Update Required",
                                message: `${leave.faculty.name}'s leave on ${new Date(leave.date).toDateString()} creates ${conflicts.conflictCount} class conflict(s). Please assign substitutes.`,
                                link: "/leave-management",
                                leaveRequestId: leave._id
                            });
                        }
                    } catch (notifErr) {
                        console.error("Failed to create timetable-update notification:", notifErr.message);
                    }
                }
            } catch (error) {
                console.error("Error resolving conflicts:", error.message, error.stack);
                leave.conflictResolution = {
                    hasConflicts: false,
                    conflictCount: 0,
                    conflicts: [],
                    resolutions: []
                };
            }
        } else {
            // REJECTED — notify faculty
            leave.conflictResolution = {
                hasConflicts: false,
                conflictCount: 0,
                conflicts: [],
                resolutions: []
            };

            try {
                await Notification.create({
                    recipientRole: "FACULTY",
                    recipientId: leave.faculty._id,
                    department: leave.department,
                    type: "LEAVE_REJECTED",
                    title: "Leave Request Rejected",
                    message: `Your leave request for ${new Date(leave.date).toDateString()} has been rejected.`,
                    link: "/leaves",
                    leaveRequestId: leave._id
                });
            } catch (notifError) {
                console.error("Failed to create rejection notification:", notifError.message);
            }
        }

        try {
            leave.markModified("conflictResolution");
            await leave.save();
        } catch (saveErr) {
            console.error("[updateLeaveStatus] Failed to save leave:", saveErr.message, saveErr.errors);
            return res.status(500).json({ message: "Failed to save leave record: " + saveErr.message });
        }

        res.status(200).json({
            message: `Leave ${status.toLowerCase()} successfully`,
            data: leave,
            conflicts: leave.conflictResolution
        });
    } catch (error) {
        console.error("[updateLeaveStatus] Unexpected error:", error.message, error.stack);
        res.status(500).json({ message: error.message });
    }
};
