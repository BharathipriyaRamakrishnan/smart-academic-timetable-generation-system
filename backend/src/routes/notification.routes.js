import express from "express";
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead,
    getUnreadCount
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/mark-all-read", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);

export default router;
