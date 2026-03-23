import express from "express";
import {
    generateTimetable,
    getTimetables,
    saveTimetable,
    deleteTimetable,
    approveTimetable,
    rejectTimetable,
} from "../controllers/timetable.controller.js";
import { protect, coordinatorOnly, adminOnly, adminOrCoordinatorOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getTimetables);
router.post("/save", protect, coordinatorOnly, saveTimetable);
router.post("/generate", protect, coordinatorOnly, generateTimetable);
router.delete("/:id", protect, adminOrCoordinatorOnly, deleteTimetable);
router.patch("/:id/approve", protect, adminOnly, approveTimetable);
router.patch("/:id/reject", protect, adminOnly, rejectTimetable);

export default router;
