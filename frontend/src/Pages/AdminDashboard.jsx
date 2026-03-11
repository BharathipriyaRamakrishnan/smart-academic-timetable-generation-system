import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import {
    FaChalkboardTeacher, FaSchool, FaBook, FaUsers, FaClock,
    FaTrash, FaCheck, FaTimes, FaHourglassHalf, FaCheckCircle, FaBan
} from "react-icons/fa";

// ── Status badge config ───────────────────────────────────────
const STATUS_CONFIG = {
    DRAFT: { label: "Draft", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
    PENDING_APPROVAL: { label: "Pending Approval", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    APPROVED: { label: "Approved", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    REJECTED: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    PUBLISHED: { label: "Published", color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
        <span style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "20px",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: cfg.color,
            background: cfg.bg,
            border: `1px solid ${cfg.color}40`,
            whiteSpace: "nowrap"
        }}>
            {cfg.label}
        </span>
    );
};

export default function AdminDashboard() {
    const [stats, setStats] = useState({ classrooms: 0, faculty: 0, subjects: 0, batches: 0, timetables: 0 });
    const [timetables, setTimetables] = useState([]);
    const [activeTab, setActiveTab] = useState("pending"); // "pending" | "all"
    const [rejectModal, setRejectModal] = useState(null);  // { id, name }
    const [rejectReason, setRejectReason] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => { fetchStats(); fetchTimetables(); }, []);

    const getHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
    };

    const fetchStats = async () => {
        try {
            const h = getHeaders();
            const [cr, fc, sb, bt, tt] = await Promise.all([
                fetch("/api/classrooms", { headers: h }).then(r => r.json()),
                fetch("/api/faculty", { headers: h }).then(r => r.json()),
                fetch("/api/subjects", { headers: h }).then(r => r.json()),
                fetch("/api/batches", { headers: h }).then(r => r.json()),
                fetch("/api/timetables", { headers: h }).then(r => r.json()),
            ]);
            setStats({
                classrooms: Array.isArray(cr) ? cr.length : 0,
                faculty: Array.isArray(fc) ? fc.length : 0,
                subjects: Array.isArray(sb) ? sb.length : 0,
                batches: Array.isArray(bt) ? bt.length : 0,
                timetables: Array.isArray(tt) ? tt.length : 0,
            });
        } catch (e) { console.error("Stats fetch error:", e); }
    };

    const fetchTimetables = async () => {
        try {
            const res = await fetch("/api/timetables", { headers: getHeaders() });
            const data = await res.json();
            setTimetables(Array.isArray(data) ? data : []);
        } catch (e) { console.error("Timetable fetch error:", e); }
    };

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Approve ────────────────────────────────────────────────
    const handleApprove = async (id) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/timetables/${id}/approve`, {
                method: "PATCH", headers: getHeaders()
            });
            if (res.ok) {
                setTimetables(prev => prev.map(t => t._id === id ? { ...t, status: "APPROVED" } : t));
                showToast("Timetable approved — faculty can now view it ✓", "success");
            } else {
                const err = await res.json();
                showToast(err.message || "Approval failed", "error");
            }
        } catch { showToast("Network error", "error"); }
        finally { setActionLoading(false); }
    };

    // ── Reject ─────────────────────────────────────────────────
    const handleReject = async () => {
        if (!rejectModal) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/timetables/${rejectModal.id}/reject`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ reason: rejectReason || "No reason provided" })
            });
            if (res.ok) {
                setTimetables(prev => prev.map(t =>
                    t._id === rejectModal.id ? { ...t, status: "REJECTED", rejectionReason: rejectReason } : t
                ));
                showToast("Timetable rejected — coordinator will be notified", "error");
            } else {
                const err = await res.json();
                showToast(err.message || "Rejection failed", "error");
            }
        } catch { showToast("Network error", "error"); }
        finally { setActionLoading(false); setRejectModal(null); setRejectReason(""); }
    };

    // ── Delete ─────────────────────────────────────────────────
    const handleDelete = async (id) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/timetables/${id}`, { method: "DELETE", headers: getHeaders() });
            if (res.ok) {
                setTimetables(prev => prev.filter(t => t._id !== id));
                setStats(prev => ({ ...prev, timetables: Math.max(0, prev.timetables - 1) }));
                showToast("Timetable deleted", "success");
            } else {
                const err = await res.json();
                showToast(err.message || "Delete failed", "error");
            }
        } catch { showToast("Network error", "error"); }
        finally { setActionLoading(false); setDeleteConfirm(null); }
    };

    // ── Derived lists ──────────────────────────────────────────
    const pendingList = timetables.filter(t => t.status === "PENDING_APPROVAL");
    const allList = timetables;
    const displayList = activeTab === "pending" ? pendingList : allList;

    // ── Render ─────────────────────────────────────────────────
    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">Dashboard</h1>
                </header>

                {/* Toast */}
                {toast && (
                    <div style={{
                        position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 9999,
                        padding: "0.85rem 1.5rem", borderRadius: "10px",
                        background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                        color: toast.type === "success" ? "rgb(16,185,129)" : "rgb(239,68,68)",
                        backdropFilter: "blur(10px)", fontSize: "0.95rem", fontWeight: 500,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
                    }}>
                        {toast.message}
                    </div>
                )}

                {/* Reject Reason Modal */}
                {rejectModal && (
                    <div style={{
                        position: "fixed", inset: 0, zIndex: 9998,
                        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <div style={{
                            background: "var(--glass-bg, #1e1e2e)", border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "16px", padding: "2rem", width: "min(420px,90vw)",
                            boxShadow: "0 24px 60px rgba(0,0,0,0.5)"
                        }}>
                            <h3 style={{ margin: "0 0 0.5rem" }}>Reject Timetable</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                                <strong>{rejectModal.name}</strong> — provide an optional reason for rejection.
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="e.g. Faculty conflict detected in period 3…"
                                rows={3}
                                style={{
                                    width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px",
                                    color: "inherit", padding: "0.75rem 1rem", fontSize: "0.9rem",
                                    resize: "vertical", outline: "none", fontFamily: "inherit"
                                }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                                <button onClick={() => { setRejectModal(null); setRejectReason(""); }}
                                    style={cancelBtnStyle}>Cancel</button>
                                <button onClick={handleReject} disabled={actionLoading}
                                    style={dangerBtnStyle}>
                                    {actionLoading ? "Rejecting…" : "Confirm Reject"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stat Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                    <StatCard title="Classrooms" count={stats.classrooms} icon={<FaSchool />} color="236, 72, 153" />
                    <StatCard title="Faculty" count={stats.faculty} icon={<FaChalkboardTeacher />} color="139, 92, 246" />
                    <StatCard title="Subjects" count={stats.subjects} icon={<FaBook />} color="59, 130, 246" />
                    <StatCard title="Batches" count={stats.batches} icon={<FaUsers />} color="16, 185, 129" />
                    <StatCard title="Timetables" count={stats.timetables} icon={<FaClock />} color="245, 158, 11" />
                </div>

                {/* ── Timetable Section ─────────────────────────────── */}
                <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
                    {/* Section Header + Tabs */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                        <div>
                            <h2 style={{ margin: 0 }}>Timetable Management</h2>
                            {pendingList.length > 0 && (
                                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#f59e0b" }}>
                                    ⚠ {pendingList.length} timetable{pendingList.length > 1 ? "s" : ""} awaiting your approval
                                </p>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            {[
                                { key: "pending", icon: <FaHourglassHalf />, label: `Pending (${pendingList.length})` },
                                { key: "all", icon: <FaCheckCircle />, label: `All (${allList.length})` },
                            ].map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    style={{
                                        display: "inline-flex", alignItems: "center", gap: "0.4rem",
                                        padding: "0.45rem 1rem", borderRadius: "8px", cursor: "pointer",
                                        fontSize: "0.85rem", fontWeight: 500, transition: "all 0.2s",
                                        border: activeTab === tab.key ? "none" : "1px solid rgba(255,255,255,0.12)",
                                        background: activeTab === tab.key ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
                                        color: activeTab === tab.key ? "#a78bfa" : "var(--text-muted)"
                                    }}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    {displayList.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                            {activeTab === "pending"
                                ? <><FaCheckCircle style={{ fontSize: "2.5rem", color: "#10b981", marginBottom: "0.75rem", display: "block", margin: "0 auto 0.75rem" }} />No timetables pending approval</>
                                : "No timetables found"}
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                        <th style={thStyle}>Name / Department</th>
                                        <th style={thStyle}>Semester</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Date</th>
                                        <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayList.map(tt => (
                                        <tr key={tt._id}
                                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{tt.name || "—"}</div>
                                                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>{tt.department}</div>
                                                {tt.status === "REJECTED" && tt.rejectionReason && (
                                                    <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "3px" }}>
                                                        ↩ {tt.rejectionReason}
                                                    </div>
                                                )}
                                            </td>

                                            <td style={tdStyle}>{tt.semester ? `Semester ${tt.semester}` : "—"}</td>

                                            <td style={tdStyle}><StatusBadge status={tt.status} /></td>

                                            <td style={tdStyle}>
                                                {tt.createdAt
                                                    ? new Date(tt.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                                    : "—"}
                                            </td>

                                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                                <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>

                                                    {/* Approve button — only for PENDING */}
                                                    {tt.status === "PENDING_APPROVAL" && (
                                                        <button onClick={() => handleApprove(tt._id)} disabled={actionLoading}
                                                            title="Approve this timetable"
                                                            style={approveBtnStyle}
                                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.3)"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,0.12)"}>
                                                            <FaCheck style={{ marginRight: "0.35rem" }} /> Approve
                                                        </button>
                                                    )}

                                                    {/* Reject button — only for PENDING */}
                                                    {tt.status === "PENDING_APPROVAL" && (
                                                        <button onClick={() => setRejectModal({ id: tt._id, name: tt.name })}
                                                            title="Reject this timetable"
                                                            style={rejectBtnStyle}
                                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.25)"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}>
                                                            <FaTimes style={{ marginRight: "0.35rem" }} /> Reject
                                                        </button>
                                                    )}

                                                    {/* Delete (inline confirm) */}
                                                    {deleteConfirm === tt._id ? (
                                                        <>
                                                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Sure?</span>
                                                            <button onClick={() => handleDelete(tt._id)} disabled={actionLoading}
                                                                style={dangerBtnStyle}>
                                                                {actionLoading ? "…" : "Delete"}
                                                            </button>
                                                            <button onClick={() => setDeleteConfirm(null)} style={cancelBtnStyle}>Cancel</button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => setDeleteConfirm(tt._id)} title="Delete timetable"
                                                            style={deleteBtnStyle}
                                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Welcome Info */}
                <div className="glass-panel" style={{ padding: "2rem" }}>
                    <h2>Welcome to Smart Timetable System</h2>
                    <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
                        Coordinators generate timetables that appear here for your review. Approve them to make them
                        visible to faculty, or reject them with feedback for the coordinator to revise.
                        You can also delete any timetable from this panel.
                    </p>
                </div>
            </main>
        </div>
    );
}

/* ── Sub-component ─────────────────────────────────────────── */
const StatCard = ({ title, count, icon, color }) => (
    <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
            background: `rgba(${color}, 0.2)`, color: `rgb(${color})`,
            padding: "1rem", borderRadius: "12px", fontSize: "1.5rem", display: "flex"
        }}>
            {icon}
        </div>
        <div>
            <h3 style={{ margin: 0, fontSize: "2rem" }}>{count}</h3>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>{title}</p>
        </div>
    </div>
);

/* ── Style constants ───────────────────────────────────────── */
const thStyle = {
    padding: "0.65rem 1rem", textAlign: "left",
    color: "var(--text-muted)", fontWeight: 600,
    fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em"
};
const tdStyle = { padding: "0.85rem 1rem" };

const approveBtnStyle = {
    display: "inline-flex", alignItems: "center", padding: "0.4rem 0.85rem",
    borderRadius: "8px", border: "1px solid rgba(16,185,129,0.35)",
    background: "rgba(16,185,129,0.12)", color: "rgb(16,185,129)",
    cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, transition: "background 0.2s"
};
const rejectBtnStyle = {
    display: "inline-flex", alignItems: "center", padding: "0.4rem 0.85rem",
    borderRadius: "8px", border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.12)", color: "rgb(239,68,68)",
    cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, transition: "background 0.2s"
};
const deleteBtnStyle = {
    display: "inline-flex", alignItems: "center", padding: "0.4rem 0.6rem",
    borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent", color: "#64748b",
    cursor: "pointer", fontSize: "0.85rem", transition: "background 0.2s"
};
const dangerBtnStyle = {
    padding: "0.4rem 0.9rem", borderRadius: "8px", border: "none",
    background: "rgba(239,68,68,0.85)", color: "#fff",
    cursor: "pointer", fontSize: "0.85rem", fontWeight: 600
};
const cancelBtnStyle = {
    padding: "0.4rem 0.9rem", borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.05)", color: "var(--text-muted)",
    cursor: "pointer", fontSize: "0.85rem"
};
