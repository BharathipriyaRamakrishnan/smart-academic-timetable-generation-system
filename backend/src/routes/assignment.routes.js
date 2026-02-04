import express from "express";
import {
    getAssignments,
    getGroupAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment
} from "../controllers/assignment.controller.js";
import { protect, adminOrCoordinatorOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all assignments for a department
router.get("/department/:department", getAssignments);

// Get assignments for specific student group
router.get("/department/:department/semester/:semester/group/:studentGroup", getGroupAssignments);

// Create, update, delete (Coordinator or Admin only)
router.post("/", adminOrCoordinatorOnly, createAssignment);
router.put("/:id", adminOrCoordinatorOnly, updateAssignment);
router.delete("/:id", adminOrCoordinatorOnly, deleteAssignment);

export default router;
