import express from "express";
import {
    getGlobalConstraints,
    setGlobalConstraints,
    getDepartmentConstraints,
    setDepartmentConstraints,
    getAllConstraints
} from "../controllers/constraint.controller.js";
import { protect, adminOnly, coordinatorOnly, adminOrCoordinatorOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Global constraints (Admin only)
router.get("/global", protect, getGlobalConstraints);
router.post("/global", protect, adminOnly, setGlobalConstraints);

// Department constraints (Coordinator or Admin)
router.get("/department/:department", protect, getDepartmentConstraints);
router.post("/department", protect, adminOrCoordinatorOnly, setDepartmentConstraints);

// Get all constraints
router.get("/all", protect, getAllConstraints);

export default router;
