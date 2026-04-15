import Timetable from "../models/Timetable.js";
import Faculty from "../models/Faculty.js";
import LeaveRequest from "../models/LeaveRequest.js";
import SubstitutionLog from "../models/SubstitutionLog.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { isSlotBusy } from "../services/leaveConflictResolver.js";

/* ─────────────────────────────────────────────────────────────────
   POST /api/substitutions/assign
   Coordinator assigns a substitute faculty for a specific conflict slot
────────────────────────────────────────────────────────────────── */
export const assignSubstitute = async (req, res) => {
    try {
        const {
            leaveRequestId,
            timetableId,
            day,
            time,
            substituteFacultyId
        } = req.body;

        if (!leaveRequestId || !timetableId || !day || !time || !substituteFacultyId) {
            return res.status(400).json({ message: "All fields are required: leaveRequestId, timetableId, day, time, substituteFacultyId" });
        }

        // ── Validate leave request ──────────────────────────────────
        const leave = await LeaveRequest.findById(leaveRequestId)
            .populate("faculty", "name email department");
        if (!leave) return res.status(404).json({ message: "Leave request not found" });

        if (req.user.role === "COORDINATOR" && req.user.department !== leave.department) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (leave.status !== "APPROVED") {
            return res.status(400).json({ message: "Can only assign substitutes for approved leaves" });
        }

        // ── Validate substitute faculty ─────────────────────────────
        const substituteFaculty = await Faculty.findById(substituteFacultyId);
        if (!substituteFaculty) return res.status(404).json({ message: "Substitute faculty not found" });

        // ── Check substitute is not busy at that slot ───────────────
        const alreadyBusy = await isSlotBusy(substituteFacultyId, day, time);
        if (alreadyBusy) {
            return res.status(409).json({
                message: `${substituteFaculty.name} is already assigned to another class at ${time} on ${day}`
            });
        }

        // ── Check substitute is not on leave ────────────────────────
        const subOnLeave = await LeaveRequest.findOne({
            faculty: substituteFacultyId,
            status: "APPROVED",
            date: leave.date
        });
        if (subOnLeave) {
            return res.status(409).json({
                message: `${substituteFaculty.name} is on approved leave on that date`
            });
        }

        // ── Update the timetable slot ───────────────────────────────
        const timetable = await Timetable.findById(timetableId);
        if (!timetable) return res.status(404).json({ message: "Timetable not found" });

        if (req.user.role === "COORDINATOR" && timetable.department !== req.user.department) {
            return res.status(403).json({ message: "You can only modify your department's timetables" });
        }

        const daySchedule = timetable.schedule.find(s => s.day === day);
        if (!daySchedule) return res.status(404).json({ message: `No schedule found for ${day}` });

        const slot = daySchedule.slots.find(s => s.time === time);
        if (!slot) return res.status(404).json({ message: `No slot found at ${time}` });

        // Ensure the slot actually belongs to the faculty on leave
        const slotFacultyId = slot.faculty?.toString();
        const leaveFacultyId = leave.faculty._id?.toString() || leave.faculty.toString();
        if (slotFacultyId && slotFacultyId !== leaveFacultyId) {
            console.warn(`[assignSubstitute] Slot faculty (${slotFacultyId}) does not match leave faculty (${leaveFacultyId}). Proceeding anyway.`);
        }

        // Check if there's already an active substitution for this slot
        const existingSub = await SubstitutionLog.findOne({
            leaveRequestId,
            timetableId,
            day,
            time,
            status: "ACTIVE"
        });
        if (existingSub) {
            return res.status(409).json({
                message: "A substitution is already active for this slot. Revert it first."
            });
        }

        // Store original faculty BEFORE overwriting
        const originalFacultyId = slot.faculty || leave.faculty._id;
        const originalFaculty = originalFacultyId ? await Faculty.findById(originalFacultyId) : null;
        const originalFacultyName = originalFaculty?.name || leave.faculty?.name || "Unknown";

        // Apply the substitution
        slot.faculty = substituteFacultyId;
        timetable.version = (timetable.version || 1) + 1;
        await timetable.save();

        // ── Create substitution log ─────────────────────────────────
        // Populate subject & classroom info from the ORIGINAL slot data
        // (fetch before-save snapshot by re-querying with populations)
        const populatedTimetable = await Timetable.findById(timetableId)
            .populate("schedule.slots.subject", "name")
            .populate("schedule.slots.classroom", "name");

        const populatedDaySchedule = populatedTimetable.schedule.find(s => s.day === day);
        const populatedSlot = populatedDaySchedule?.slots.find(s => s.time === time);

        // Resolve conflict data: fallback to raw conflict data from leaveRequest resolutions
        let subjectName = populatedSlot?.subject?.name || null;
        let subjectId = populatedSlot?.subject?._id || null;
        let classroomName = populatedSlot?.classroom?.name || null;
        let classroomId = populatedSlot?.classroom?._id || null;

        if (!subjectName && leave.conflictResolution?.conflicts) {
            const matchedConflict = leave.conflictResolution.conflicts.find(
                c => c.timetableId?.toString() === timetableId && c.time === time
            );
            if (matchedConflict) {
                subjectName = matchedConflict.subject?.name || subjectName;
                subjectId = matchedConflict.subject?._id || subjectId;
                classroomName = matchedConflict.classroom?.name || classroomName;
                classroomId = matchedConflict.classroom?._id || classroomId;
            }
        }

        const logEntry = await SubstitutionLog.create({
            leaveRequestId,
            timetableId,
            timetableName: timetable.name,
            day,
            time,
            subjectId: subjectId || null,
            subjectName: subjectName || "—",
            classroomId: classroomId || null,
            classroomName: classroomName || "—",
            originalFacultyId: originalFacultyId,
            originalFacultyName,
            substituteFacultyId,
            substituteFacultyName: substituteFaculty.name,
            assignedBy: req.user.id,
            department: leave.department,
            leaveDate: leave.date
        });

        // ── Mark resolution as applied in leave request ─────────────
        try {
            const freshLeave = await LeaveRequest.findById(leaveRequestId);
            if (freshLeave?.conflictResolution?.resolutions) {
                const resolution = freshLeave.conflictResolution.resolutions.find(
                    r => r.conflict?.timetableId?.toString() === timetableId.toString() &&
                         r.conflict?.time === time
                );
                if (resolution) {
                    resolution.suggestions.forEach(s => {
                        s.status = "APPLIED";
                        s.appliedAt = new Date();
                    });
                    resolution.resolvedSuggestionIndex = 0;
                    freshLeave.markModified("conflictResolution");
                    await freshLeave.save();
                }
            }
        } catch (markErr) {
            console.warn("[assignSubstitute] Could not mark resolution as applied:", markErr.message);
        }

        // ── Notify substitute faculty ───────────────────────────────
        try {
            // Find the User account linked to this Faculty via email bridge
            const subUser = await User.findOne({ email: new RegExp('^' + substituteFaculty.email + '$', 'i') });

            if (subUser) {
                const coordinator = await User.findById(req.user.id).select("name");
                const formattedDate = new Date(leave.date).toLocaleDateString("en-IN", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric"
                });
                const subjectInfo = subjectName && subjectName !== "—" ? subjectName : "a class";
                const classroomInfo = classroomName && classroomName !== "—" ? ` in ${classroomName}` : "";

                await Notification.create({
                    recipientRole: "FACULTY",
                    recipientId: subUser._id,
                    department: leave.department,
                    type: "SUBSTITUTION_ASSIGNED",
                    title: "📅 New Substitution Class Assigned",
                    message: `${coordinator?.name || "The Coordinator"} has assigned you to cover "${subjectInfo}"${classroomInfo} on ${day} at ${time} (${formattedDate}), substituting for ${originalFacultyName}. Please check your timetable for the updated schedule.`,
                    link: "/timetable",
                    leaveRequestId
                });
                console.log(`[assignSubstitute] Notification sent to ${subUser.email} (${subUser._id})`);
            } else {
                console.warn(`[assignSubstitute] No User account found for substitute faculty email: ${substituteFaculty.email}. Notification skipped.`);
            }
        } catch (notifErr) {
            console.error("Failed to notify substitute faculty:", notifErr);
        }

        res.status(200).json({
            message: `${substituteFaculty.name} has been assigned as substitute successfully`,
            data: logEntry
        });
    } catch (error) {
        console.error("Error assigning substitute:", error);
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/substitutions/log
   Get substitution history for the coordinator's department
────────────────────────────────────────────────────────────────── */
export const getSubstitutionLog = async (req, res) => {
    try {
        const department = req.user.department;
        if (!department) return res.status(400).json({ message: "Department context required" });

        const logs = await SubstitutionLog.find({ department })
            .populate("assignedBy", "name email")
            .populate("leaveRequestId", "date reason")
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   DELETE /api/substitutions/:id/revert
   Revert a substitution (restore original faculty to timetable slot)
────────────────────────────────────────────────────────────────── */
export const revertSubstitution = async (req, res) => {
    try {
        const { id } = req.params;

        const logEntry = await SubstitutionLog.findById(id);
        if (!logEntry) return res.status(404).json({ message: "Substitution log not found" });

        if (req.user.role === "COORDINATOR" && logEntry.department !== req.user.department) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (logEntry.status === "REVERTED") {
            return res.status(400).json({ message: "This substitution has already been reverted" });
        }

        // Restore original faculty in timetable
        const timetable = await Timetable.findById(logEntry.timetableId);
        if (!timetable) return res.status(404).json({ message: "Timetable not found" });

        const daySchedule = timetable.schedule.find(s => s.day === logEntry.day);
        if (daySchedule) {
            const slot = daySchedule.slots.find(s => s.time === logEntry.time);
            if (slot) {
                slot.faculty = logEntry.originalFacultyId;
                timetable.version = (timetable.version || 1) + 1;
                await timetable.save();
            }
        }

        // Mark log entry as reverted
        logEntry.status = "REVERTED";
        logEntry.revertedAt = new Date();
        logEntry.revertedBy = req.user.id;
        await logEntry.save();

        res.status(200).json({ message: "Substitution reverted successfully", data: logEntry });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/substitutions/available-faculty
   Get available faculty for a specific slot (for coordinator's dropdown)
   Only returns faculty from the specified department.
────────────────────────────────────────────────────────────────── */
export const getAvailableFaculty = async (req, res) => {
    try {
        const { day, time, excludeFacultyId, subjectId, leaveDate, department } = req.query;

        if (!day || !time) {
            return res.status(400).json({ message: "day and time are required" });
        }

        const { findAlternativeFaculty } = await import("../services/leaveConflictResolver.js");

        // subjectId may be null/undefined if the slot has no subject — pass null explicitly
        const safeSubjectId = subjectId && subjectId !== "undefined" && subjectId !== "null"
            ? subjectId
            : null;
        const safeLeaveeDate = leaveDate && leaveDate !== "undefined" ? leaveDate : null;
        // Use explicit department from query, fallback to coordinator's own department
        const safeDepartment = department && department !== "undefined" && department !== "null"
            ? department
            : req.user.department || null;

        // ── Resolve excludeFacultyId: User._id → Faculty._id ────────────
        // The frontend passes leave.faculty._id which is a User ObjectId
        // (LeaveRequest.faculty references the User model). But
        // findAlternativeFaculty compares against Faculty._id.
        // We bridge via email: User.email === Faculty.email
        let resolvedExcludeId = "000000000000000000000000";
        if (excludeFacultyId && excludeFacultyId !== "undefined" && excludeFacultyId !== "null") {
            try {
                // First try: maybe it's already a Faculty._id
                const directFaculty = await Faculty.findById(excludeFacultyId);
                if (directFaculty) {
                    resolvedExcludeId = directFaculty._id.toString();
                } else {
                    // It's likely a User._id — resolve via email bridge
                    const userDoc = await User.findById(excludeFacultyId).select("email");
                    if (userDoc) {
                        const facultyDoc = await Faculty.findOne({ email: new RegExp('^' + userDoc.email + '$', 'i') }).select("_id");
                        if (facultyDoc) {
                            resolvedExcludeId = facultyDoc._id.toString();
                            console.log(`[getAvailableFaculty] Resolved User ${excludeFacultyId} → Faculty ${resolvedExcludeId}`);
                        }
                    }
                }
            } catch (resolveErr) {
                console.warn("[getAvailableFaculty] Could not resolve excludeFacultyId:", resolveErr.message);
            }
        }

        const alternatives = await findAlternativeFaculty(safeSubjectId, day, time, resolvedExcludeId, safeLeaveeDate, safeDepartment);

        res.status(200).json(alternatives);
    } catch (error) {
        console.error("[getAvailableFaculty] Error:", error);
        res.status(500).json({ message: error.message });
    }
};
