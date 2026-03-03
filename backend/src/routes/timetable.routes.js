import express from "express";
import {
    generateTimetable,
    getTimetables,
    saveTimetable,
} from "../controllers/timetable.controller.js";
import { protect, coordinatorOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getTimetables);
router.post("/save", protect, coordinatorOnly, saveTimetable);
router.post("/generate", protect, coordinatorOnly, generateTimetable);

export default router;
