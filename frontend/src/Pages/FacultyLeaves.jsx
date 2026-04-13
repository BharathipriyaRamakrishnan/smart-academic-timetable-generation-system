import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

const STATUS_CONFIG = {
    PENDING:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)",  icon: "⏳", label: "Pending" },
    APPROVED: { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)",  icon: "✅", label: "Approved" },
    REJECTED: { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",   icon: "❌", label: "Rejected" }
};

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 9999,
            padding: "1rem 1.5rem",
            borderRadius: "14px",
            background: type === "success" ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)",
            color: "white",
            fontWeight: 600,
            fontSize: "0.9rem",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            animation: "slideInToast 0.3s ease",
            maxWidth: "360px"
        }}>
            <span style={{ fontSize: "1.2rem" }}>{type === "success" ? "✅" : "❌"}</span>
            {message}
        </div>
    );
}

export default function FacultyLeaves() {
    const [leaves, setLeaves] = useState([]);
    const [leaveDate, setLeaveDate] = useState("");
    const [leaveReason, setLeaveReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState("apply");

    const token = localStorage.getItem("token");

    useEffect(() => { fetchLeaves(); }, []);

    const showToast = (message, type = "success") => setToast({ message, type });

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/leaves/my", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setLeaves(data);
        } catch (err) {
            console.error("Error fetching leaves:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!leaveDate || !leaveReason.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/leaves", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ date: leaveDate, reason: leaveReason })
            });
            const data = await res.json();
            if (res.ok) {
                showToast("Leave request submitted successfully!");
                setLeaveDate("");
                setLeaveReason("");
                fetchLeaves();
                setActiveTab("history");
            } else {
                showToast(data.message || "Failed to submit leave request", "error");
            }
        } catch (err) {
            showToast("An error occurred. Please try again.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const pendingCount  = leaves.filter(l => l.status === "PENDING").length;
    const approvedCount = leaves.filter(l => l.status === "APPROVED").length;
    const rejectedCount = leaves.filter(l => l.status === "REJECTED").length;

    // Minimum date = today
    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                {/* Page Header */}
                <header className="page-header">
                    <div>
                        <h1 className="page-title">Leave Management</h1>
                        <p style={{ color: "var(--text-muted)", margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
                            Apply for leave and track your requests in real time.
                        </p>
                    </div>
                </header>

                {/* Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                    {[
                        { label: "Pending",  count: pendingCount,  color: "#f59e0b", icon: "⏳" },
                        { label: "Approved", count: approvedCount, color: "#10b981", icon: "✅" },
                        { label: "Rejected", count: rejectedCount, color: "#ef4444", icon: "❌" }
                    ].map(stat => (
                        <div key={stat.label} className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "14px",
                                background: `${stat.color}20`,
                                border: `1px solid ${stat.color}40`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.4rem",
                                flexShrink: 0
                            }}>{stat.icon}</div>
                            <div>
                                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.count}</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0" }}>
                    {[
                        { id: "apply",   label: "📅 Apply for Leave" },
                        { id: "history", label: `📜 My Leaves${leaves.length ? ` (${leaves.length})` : ""}` }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: "0.75rem 1.25rem",
                                borderRadius: "10px 10px 0 0",
                                background: activeTab === tab.id ? "var(--glass)" : "transparent",
                                color: activeTab === tab.id ? "var(--text-main)" : "var(--text-muted)",
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                fontSize: "0.9rem",
                                border: "none",
                                borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >{tab.label}</button>
                    ))}
                </div>

                {/* Tab: Apply for Leave */}
                {activeTab === "apply" && (
                    <div className="glass-panel" style={{ padding: "2rem", maxWidth: "560px" }}>
                        <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.1rem" }}>Submit a Leave Request</h3>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                                    Leave Date *
                                </label>
                                <input
                                    type="date"
                                    className="input-field"
                                    style={{ margin: 0 }}
                                    value={leaveDate}
                                    min={today}
                                    onChange={e => setLeaveDate(e.target.value)}
                                    required
                                    id="leave-date-input"
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                                    Reason *
                                </label>
                                <textarea
                                    className="input-field"
                                    id="leave-reason-input"
                                    placeholder="Brief reason for leave (e.g., medical appointment, personal emergency)..."
                                    style={{ margin: 0, minHeight: "100px", resize: "vertical" }}
                                    value={leaveReason}
                                    onChange={e => setLeaveReason(e.target.value)}
                                    required
                                    maxLength={500}
                                />
                                <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                    {leaveReason.length}/500
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="btn-primary"
                                id="submit-leave-btn"
                                disabled={submitting}
                                style={{ padding: "0.875rem", fontSize: "0.95rem" }}
                            >
                                {submitting ? "Submitting..." : "Submit Leave Request →"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tab: Leave History */}
                {activeTab === "history" && (
                    <div>
                        {loading ? (
                            <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                                Loading leave history...
                            </div>
                        ) : leaves.length === 0 ? (
                            <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
                                <p style={{ color: "var(--text-muted)", margin: 0 }}>No leave requests yet.</p>
                                <button className="btn-primary" onClick={() => setActiveTab("apply")} style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem" }}>
                                    Apply for Leave
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {leaves.map(leave => {
                                    const cfg = STATUS_CONFIG[leave.status] || STATUS_CONFIG.PENDING;
                                    const hasConflicts = leave.conflictResolution?.hasConflicts;
                                    return (
                                        <div
                                            key={leave._id}
                                            className="glass-panel"
                                            style={{
                                                padding: "1.5rem",
                                                borderLeft: `4px solid ${cfg.color}`,
                                                transition: "transform 0.15s"
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                                        <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                                                            📅 {new Date(leave.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                                        </div>
                                                        {hasConflicts && leave.status === "APPROVED" && (
                                                            <span style={{
                                                                padding: "2px 8px",
                                                                background: "rgba(239,68,68,0.15)",
                                                                color: "#ef4444",
                                                                borderRadius: "20px",
                                                                fontSize: "0.7rem",
                                                                fontWeight: 700,
                                                                border: "1px solid rgba(239,68,68,0.3)"
                                                            }}>
                                                                {leave.conflictResolution.conflictCount} class conflict{leave.conflictResolution.conflictCount > 1 ? "s" : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p style={{ margin: "0 0 0.75rem", color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>
                                                        "{leave.reason}"
                                                    </p>
                                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                                        Submitted {new Date(leave.createdAt).toLocaleDateString()}
                                                        {leave.processedAt && ` • ${leave.status === "APPROVED" ? "Approved" : "Rejected"} ${new Date(leave.processedAt).toLocaleDateString()}`}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-end",
                                                    gap: "0.5rem"
                                                }}>
                                                    <span style={{
                                                        padding: "0.35rem 0.9rem",
                                                        background: cfg.bg,
                                                        color: cfg.color,
                                                        border: `1px solid ${cfg.border}`,
                                                        borderRadius: "20px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 700,
                                                        whiteSpace: "nowrap"
                                                    }}>
                                                        {cfg.icon} {cfg.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <style>{`
                @keyframes slideInToast {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
