import express from "express";
import {
    createFaculty,
    deleteFaculty,
    getFaculty,
    updateFaculty,
} from "../controllers/faculty.controller.js";

const router = express.Router();

router.get("/", getFaculty);
router.post("/", createFaculty);
router.put("/:id", updateFaculty);
router.delete("/:id", deleteFaculty);

export default router;
