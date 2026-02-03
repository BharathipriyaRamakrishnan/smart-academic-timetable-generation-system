import express from "express";
import {
    createSubject,
    deleteSubject,
    getSubjects,
    updateSubject,
} from "../controllers/subject.controller.js";

const router = express.Router();

router.get("/", getSubjects);
router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
