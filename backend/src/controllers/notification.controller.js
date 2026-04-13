import Notification from "../models/Notification.js";

/* ─────────────────────────────────────────────────────────────────
   GET /api/notifications
   Returns notifications for the logged-in user (role-based + targeted)
────────────────────────────────────────────────────────────────── */
export const getNotifications = async (req, res) => {
    try {
        // Match notifications that are either:
        // a) Broadcast to the user's role (recipientId = null) OR
        // b) Specifically targeted at this user
        const notifications = await Notification.find({
            recipientRole: req.user.role,
            $or: [
                { recipientId: null },
                { recipientId: req.user.id }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(30);

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/notifications/unread-count
   Returns just the unread count for badge display
────────────────────────────────────────────────────────────────── */
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipientRole: req.user.role,
            isRead: false,
            $or: [
                { recipientId: null },
                { recipientId: req.user.id }
            ]
        });
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/notifications/:id/read
   Mark a single notification as read
────────────────────────────────────────────────────────────────── */
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: "Notification not found" });
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/notifications/mark-all-read
   Mark all notifications for the user as read
────────────────────────────────────────────────────────────────── */
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipientRole: req.user.role,
                isRead: false,
                $or: [
                    { recipientId: null },
                    { recipientId: req.user.id }
                ]
            },
            { isRead: true }
        );
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
