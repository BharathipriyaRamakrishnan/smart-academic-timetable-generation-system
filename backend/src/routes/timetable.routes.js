import express from "express";
import {
    generateTimetable,
    getTimetables,
    saveTimetable,
} from "../controllers/timetable.controller.js";

const router = express.Router();

router.get("/", getTimetables);
router.post("/save", saveTimetable);
router.post("/generate", generateTimetable);

export default router;
