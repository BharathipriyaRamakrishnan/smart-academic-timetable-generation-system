import express from "express";
import { protect, coordinatorOnly, facultyOnly } from "../middleware/auth.middleware.js";
import { 
    createLeaveRequest, 
    getMyLeaves, 
    getDepartmentLeaves, 
    updateLeaveStatus,
    getLeaveWithConflicts,
    applyConflictSuggestion
} from "../controllers/leave.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Faculty routes
router.post("/", facultyOnly, createLeaveRequest);
router.get("/my", facultyOnly, getMyLeaves);

// Coordinator/Admin routes
router.get("/department/:department", getDepartmentLeaves); // Staff/Admin can view
router.get("/:id/conflicts", coordinatorOnly, getLeaveWithConflicts); // Get leave with conflict details
router.patch("/:id/status", coordinatorOnly, updateLeaveStatus); // Approve/Reject leave
router.post("/:id/apply-suggestion", coordinatorOnly, applyConflictSuggestion); // Apply a specific suggestion

export default router;
