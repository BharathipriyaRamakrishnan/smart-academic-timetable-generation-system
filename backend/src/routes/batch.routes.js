import express from "express";
import {
    createBatch,
    deleteBatch,
    getBatches,
    updateBatch,
} from "../controllers/batch.controller.js";

const router = express.Router();

router.get("/", getBatches);
router.post("/", createBatch);
router.put("/:id", updateBatch);
router.delete("/:id", deleteBatch);

export default router;
