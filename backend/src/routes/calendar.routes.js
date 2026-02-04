import express from "express";
import {
    getCalendars,
    getCalendar,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    getActiveCalendar
} from "../controllers/calendar.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get active calendar (all authenticated users)
router.get("/active", getActiveCalendar);

// Get all calendars (all authenticated users)
router.get("/", getCalendars);

// Get specific calendar (all authenticated users)
router.get("/:year/:semester", getCalendar);

// Admin-only routes
router.post("/", adminOnly, createCalendar);
router.put("/:id", adminOnly, updateCalendar);
router.delete("/:id", adminOnly, deleteCalendar);

export default router;
