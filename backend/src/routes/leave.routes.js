import express from "express";
import { protect, coordinatorOnly, facultyOnly } from "../middleware/auth.middleware.js";
import {
    createLeaveRequest,
    getMyLeaves,
    getDepartmentLeaves,
    updateLeaveStatus,
    getLeaveWithConflicts,
    applyConflictSuggestion,
    getApprovedLeavesWithConflicts
} from "../controllers/leave.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Faculty routes
router.post("/", facultyOnly, createLeaveRequest);
router.get("/my", facultyOnly, getMyLeaves);

// Coordinator/Admin routes
router.get("/department/:department", getDepartmentLeaves);
router.get("/approved-with-conflicts", coordinatorOnly, getApprovedLeavesWithConflicts);
router.get("/:id/conflicts", coordinatorOnly, getLeaveWithConflicts);
router.patch("/:id/status", coordinatorOnly, updateLeaveStatus);
router.post("/apply-suggestion", coordinatorOnly, applyConflictSuggestion);

export default router;
