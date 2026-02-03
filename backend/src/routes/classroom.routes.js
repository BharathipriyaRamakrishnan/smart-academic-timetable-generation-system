import express from "express";
import {
    createClassroom,
    deleteClassroom,
    getClassrooms,
    updateClassroom,
} from "../controllers/classroom.controller.js";

const router = express.Router();

router.get("/", getClassrooms);
router.post("/", createClassroom);
router.put("/:id", updateClassroom);
router.delete("/:id", deleteClassroom);

export default router;
