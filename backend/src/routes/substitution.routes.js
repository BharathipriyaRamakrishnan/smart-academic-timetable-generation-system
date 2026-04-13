import express from "express";
import { protect, coordinatorOnly } from "../middleware/auth.middleware.js";
import {
    assignSubstitute,
    getSubstitutionLog,
    revertSubstitution,
    getAvailableFaculty
} from "../controllers/substitution.controller.js";

const router = express.Router();

router.use(protect);
router.use(coordinatorOnly);

router.post("/assign", assignSubstitute);
router.get("/log", getSubstitutionLog);
router.get("/available-faculty", getAvailableFaculty);
router.delete("/:id/revert", revertSubstitution);

export default router;
