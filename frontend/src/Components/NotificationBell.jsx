import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const TYPE_ICONS = {
    LEAVE_SUBMITTED: "📋",
    LEAVE_APPROVED: "✅",
    LEAVE_REJECTED: "❌",
    TIMETABLE_UPDATE_NEEDED: "⚠️",
    SUBSTITUTION_ASSIGNED: "🔄",
    TIMETABLE_MODIFIED: "📅",
    GENERAL: "🔔"
};

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Poll unread count every 8 seconds
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 8000);
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await fetch("/api/notifications/unread-count", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count);
            }
        } catch (err) {
            // silent fail
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        const next = !open;
        setOpen(next);
        if (next) fetchNotifications();
    };

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications/mark-all-read", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Error marking all read:", err);
        }
    };

    const markRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking read:", err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) await markRead(notif._id);
        if (notif.link) navigate(notif.link);
        setOpen(false);
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div ref={panelRef} style={{ position: "relative", display: "inline-block" }}>
            {/* Bell Button */}
            <button
                id="notification-bell-btn"
                onClick={handleOpen}
                style={{
                    position: "relative",
                    background: open ? "rgba(79,70,229,0.15)" : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    padding: "0.5rem 0.75rem",
                    color: "var(--text-main)",
                    cursor: "pointer",
                    fontSize: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    transition: "all 0.2s"
                }}
                title="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        color: "white",
                        borderRadius: "50%",
                        minWidth: "20px",
                        height: "20px",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid var(--bg-dark)",
                        animation: "bellPulse 2s infinite"
                    }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: "360px",
                    background: "var(--glass)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "16px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                    zIndex: 9999,
                    overflow: "hidden"
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "1rem 1.25rem",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                            Notifications
                            {unreadCount > 0 && (
                                <span style={{
                                    marginLeft: "0.5rem",
                                    background: "rgba(79,70,229,0.2)",
                                    color: "#818cf8",
                                    padding: "1px 7px",
                                    borderRadius: "20px",
                                    fontSize: "0.7rem",
                                    fontWeight: 700
                                }}>{unreadCount} new</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#818cf8",
                                    cursor: "pointer",
                                    fontSize: "0.78rem",
                                    fontWeight: 600,
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "6px",
                                    transition: "background 0.2s"
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                        {loading ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>All caught up!</div>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif._id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: "0.875rem 1.25rem",
                                        cursor: notif.link ? "pointer" : "default",
                                        background: notif.isRead ? "transparent" : "rgba(79,70,229,0.06)",
                                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                                        transition: "background 0.15s",
                                        display: "flex",
                                        gap: "0.875rem",
                                        alignItems: "flex-start"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                                    onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? "transparent" : "rgba(79,70,229,0.06)"}
                                >
                                    <span style={{ fontSize: "1.25rem", flexShrink: 0, marginTop: "2px" }}>
                                        {TYPE_ICONS[notif.type] || "🔔"}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: notif.isRead ? 500 : 700,
                                            fontSize: "0.85rem",
                                            marginBottom: "2px",
                                            color: notif.isRead ? "var(--text-muted)" : "var(--text-main)"
                                        }}>
                                            {notif.title}
                                        </div>
                                        <div style={{
                                            fontSize: "0.78rem",
                                            color: "var(--text-muted)",
                                            lineHeight: 1.4,
                                            overflow: "hidden",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical"
                                        }}>
                                            {notif.message}
                                        </div>
                                        <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                                            {timeAgo(notif.createdAt)}
                                        </div>
                                    </div>
                                    {!notif.isRead && (
                                        <div style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            background: "#818cf8",
                                            flexShrink: 0,
                                            marginTop: "6px"
                                        }} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes bellPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
            `}</style>
        </div>
    );
}
