import { useState, useEffect, useCallback } from "react";
import Sidebar from "../Components/Sidebar";

/* ─── Toast ───────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, []);
    return (
        <div style={{
            position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999,
            padding: "1rem 1.5rem", borderRadius: "14px",
            background: type === "success" ? "rgba(16,185,129,0.96)" : "rgba(239,68,68,0.96)",
            color: "white", fontWeight: 600, fontSize: "0.9rem",
            backdropFilter: "blur(12px)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", gap: "0.75rem",
            animation: "slideIn 0.3s ease", maxWidth: "380px"
        }}>
            <span style={{ fontSize: "1.2rem" }}>{type === "success" ? "✅" : "❌"}</span>
            {message}
        </div>
    );
}

/* ─── Status badge ────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const cfg = {
        PENDING:  { color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  label: "⏳ Pending"  },
        APPROVED: { color: "#10b981", bg: "rgba(16,185,129,0.15)",  label: "✅ Approved" },
        REJECTED: { color: "#ef4444", bg: "rgba(239,68,68,0.15)",   label: "❌ Rejected" }
    }[status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)", label: status };
    return (
        <span style={{
            padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.72rem",
            fontWeight: 700, color: cfg.color, background: cfg.bg,
            border: `1px solid ${cfg.color}40`, whiteSpace: "nowrap"
        }}>{cfg.label}</span>
    );
};

/* ─── Conflict Slot Card ──────────────────────────────────────── */
function ConflictSlotCard({ conflict, resolution, leaveId, leaveDate, leaveFacultyId, department, onAssigned }) {
    const [selectedFacultyId, setSelectedFacultyId] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [availableFaculty, setAvailableFaculty] = useState([]);
    const [loadingFaculty, setLoadingFaculty] = useState(true);
    const token = localStorage.getItem("token");

    const isResolved = resolution?.suggestions?.[0]?.status === "APPLIED";

    useEffect(() => {
        loadAvailableFaculty();
    }, []);

    const loadAvailableFaculty = async () => {
        setLoadingFaculty(true);
        try {
            const subjectId = conflict.subject?._id || conflict.subject || "";
            const excludeId = leaveFacultyId || "000000000000000000000000";
            const params = new URLSearchParams({
                day: conflict.day,
                time: conflict.time,
                excludeFacultyId: excludeId,
                ...(subjectId && subjectId !== "[object Object]" && { subjectId }),
                ...(leaveDate && { leaveDate: new Date(leaveDate).toISOString() }),
                ...(department && { department })
            });
            const res = await fetch(`/api/substitutions/available-faculty?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAvailableFaculty(data);
            }
        } catch (err) {
            console.error("Error loading faculty:", err);
        } finally {
            setLoadingFaculty(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedFacultyId) return;
        setAssigning(true);
        try {
            const res = await fetch("/api/substitutions/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    leaveRequestId: leaveId,
                    timetableId: conflict.timetableId,
                    day: conflict.day,
                    time: conflict.time,
                    substituteFacultyId: selectedFacultyId
                })
            });
            const data = await res.json();
            if (res.ok) {
                onAssigned(data.message || "Substitute assigned!");
            } else {
                onAssigned(data.message || "Assignment failed", "error");
            }
        } catch (err) {
            onAssigned("An error occurred", "error");
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div style={{
            padding: "1.25rem",
            background: isResolved ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${isResolved ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
            borderRadius: "12px",
            marginBottom: "0.75rem"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                        🕐 {conflict.time} &nbsp;·&nbsp; {conflict.day}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        {conflict.subject && (
                            <span>📚 {conflict.subject.name || conflict.subject}</span>
                        )}
                        {conflict.classroom && (
                            <span>🏫 {conflict.classroom.name || conflict.classroom}</span>
                        )}
                        <span style={{
                            padding: "1px 7px", borderRadius: "8px", fontSize: "0.72rem",
                            background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)"
                        }}>{conflict.type}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                        📋 {conflict.timetableName}
                    </div>
                </div>

                {isResolved && (
                    <span style={{
                        padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.72rem",
                        fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.3)", whiteSpace: "nowrap"
                    }}>✅ Resolved</span>
                )}
            </div>

            {/* Assignment area */}
            {!isResolved && (
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                        value={selectedFacultyId}
                        onChange={e => setSelectedFacultyId(e.target.value)}
                        id={`faculty-select-${conflict.timetableId}-${conflict.time}`}
                        style={{
                            flex: 1, minWidth: "200px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-main)",
                            padding: "0.6rem 0.875rem",
                            borderRadius: "10px",
                            fontSize: "0.85rem",
                            cursor: "pointer"
                        }}
                    >
                        <option value="">
                            {loadingFaculty ? "Loading faculty..." : availableFaculty.length === 0 ? "No available faculty" : "— Select substitute faculty —"}
                        </option>
                        {/* Priority 1: Formally assigned to this subject */}
                        {availableFaculty.some(f => f.priority === 1) && (
                            <option disabled style={{ fontWeight: 700 }}>── ⭐ Assigned to this Subject ──</option>
                        )}
                        {availableFaculty.filter(f => f.priority === 1).map(f => (
                            <option key={f.id} value={f.id}>
                                ⭐ {f.name}{f.designation ? ` (${f.designation})` : ""} — Assigned
                            </option>
                        ))}
                        {/* Priority 2: Can teach this subject */}
                        {availableFaculty.some(f => f.priority === 2) && (
                            <option disabled style={{ fontWeight: 700 }}>── 📚 Can Teach this Subject ──</option>
                        )}
                        {availableFaculty.filter(f => f.priority === 2).map(f => (
                            <option key={f.id} value={f.id}>
                                📚 {f.name}{f.designation ? ` (${f.designation})` : ""} — Subject Expert
                            </option>
                        ))}
                        {/* Priority 3: Other available faculty */}
                        {availableFaculty.some(f => f.priority === 3) && (
                            <option disabled style={{ fontWeight: 700 }}>── Other Available Faculty ──</option>
                        )}
                        {availableFaculty.filter(f => f.priority === 3).map(f => (
                            <option key={f.id} value={f.id}>
                                {f.name}{f.designation ? ` (${f.designation})` : ""}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAssign}
                        disabled={assigning || !selectedFacultyId}
                        className="btn-primary"
                        style={{
                            padding: "0.6rem 1.25rem",
                            fontSize: "0.85rem",
                            opacity: (!selectedFacultyId || assigning) ? 0.5 : 1,
                            flexShrink: 0
                        }}
                    >
                        {assigning ? "Assigning..." : "Assign Substitute →"}
                    </button>
                </div>
            )}

            {/* Availability info */}
            {!isResolved && !loadingFaculty && (
                <div style={{
                    marginTop: "0.6rem", fontSize: "0.75rem",
                    color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem"
                }}>
                    🛡️ Only showing faculty with <strong style={{ color: "#10b981" }}>no scheduling conflicts</strong> at {conflict.time} on {conflict.day}
                    {availableFaculty.length > 0 && (
                        <span style={{
                            marginLeft: "0.5rem",
                            padding: "1px 6px",
                            borderRadius: "6px",
                            fontSize: "0.7rem",
                            background: "rgba(16,185,129,0.12)",
                            color: "#10b981",
                            fontWeight: 600
                        }}>
                            {availableFaculty.length} available
                        </span>
                    )}
                </div>
            )}

            {/* Live suggestion from the same dataset as the dropdown */}
            {!isResolved && !loadingFaculty && availableFaculty.length > 0 && (
                <div style={{
                    marginTop: "0.75rem", fontSize: "0.78rem",
                    color: "#a78bfa", display: "flex", alignItems: "center", gap: "0.4rem"
                }}>
                    💡 System suggests: <strong>{availableFaculty[0].name}</strong>
                    {availableFaculty[0].priority === 1 ? " (Assigned to Subject)" : 
                     availableFaculty[0].priority === 2 ? " (Can Teach Subject)" : ""}
                </div>
            )}
        </div>
    );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function LeaveManagement() {
    const [activeTab, setActiveTab] = useState("pending");
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [approvedLeaves, setApprovedLeaves] = useState([]);
    const [subLog, setSubLog] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [processing, setProcessing] = useState({}); // { [leaveId]: true }
    const [revertingId, setRevertingId] = useState(null);

    const token = localStorage.getItem("token");
    const department = localStorage.getItem("department") || "";

    const showToast = (message, type = "success") => setToast({ message, type });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [pendRes, approvedRes, logRes] = await Promise.all([
                fetch(`/api/leaves/department/${department}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/leaves/approved-with-conflicts", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/substitutions/log", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (pendRes.ok) {
                const data = await pendRes.json();
                setPendingLeaves(data.filter(l => l.status === "PENDING"));
            }
            if (approvedRes.ok) setApprovedLeaves(await approvedRes.json());
            if (logRes.ok) setSubLog(await logRes.json());
        } catch (err) {
            console.error("Error fetching leave management data:", err);
        } finally {
            setLoading(false);
        }
    }, [department, token]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleLeaveStatus = async (leaveId, status) => {
        setProcessing(prev => ({ ...prev, [leaveId]: true }));
        try {
            const res = await fetch(`/api/leaves/${leaveId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`Leave ${status.toLowerCase()} successfully`);
                fetchAll();
                if (status === "APPROVED" && data.conflicts?.hasConflicts) {
                    setActiveTab("conflicts");
                }
            } else {
                showToast(data.message || "Action failed", "error");
            }
        } catch (err) {
            showToast("An error occurred", "error");
        } finally {
            setProcessing(prev => ({ ...prev, [leaveId]: false }));
        }
    };

    const handleSubAssigned = (message, type = "success") => {
        showToast(message, type);
        if (type === "success") fetchAll();
    };

    const handleRevert = async (logId) => {
        if (!window.confirm("Revert this substitution? The original faculty will be restored.")) return;
        setRevertingId(logId);
        try {
            const res = await fetch(`/api/substitutions/${logId}/revert`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) { showToast("Substitution reverted"); fetchAll(); }
            else showToast(data.message || "Failed to revert", "error");
        } catch (err) {
            showToast("Error reverting substitution", "error");
        } finally {
            setRevertingId(null);
        }
    };

    const TABS = [
        { id: "pending",   label: `⏳ Pending Approvals${pendingLeaves.length ? ` (${pendingLeaves.length})` : ""}` },
        { id: "conflicts", label: `⚠️ Action Required${approvedLeaves.length ? ` (${approvedLeaves.length})` : ""}` },
        { id: "log",       label: `📋 Substitution Log${subLog.length ? ` (${subLog.length})` : ""}` }
    ];

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                {/* Header */}
                <header className="page-header" style={{ marginBottom: "1.5rem" }}>
                    <div>
                        <h1 className="page-title">Leave Management</h1>
                        <p style={{ color: "var(--text-muted)", margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
                            Manage faculty leaves, resolve class conflicts, and assign substitutes.
                        </p>
                    </div>
                    <div style={{
                        padding: "0.5rem 1.1rem",
                        background: "rgba(79,70,229,0.1)",
                        borderRadius: "20px",
                        color: "#818cf8",
                        fontSize: "0.85rem",
                        fontWeight: 600
                    }}>
                        🏛 {department}
                    </div>
                </header>

                {/* Summary Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                    {[
                        { label: "Pending Requests", value: pendingLeaves.length,  color: "#f59e0b", icon: "⏳" },
                        { label: "Needs Action",     value: approvedLeaves.length, color: "#ef4444", icon: "⚠️" },
                        { label: "Substitutions Made", value: subLog.filter(l => l.status === "ACTIVE").length, color: "#10b981", icon: "🔄" }
                    ].map(s => (
                        <div key={s.label} className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div style={{
                                width: "46px", height: "46px", borderRadius: "12px",
                                background: `${s.color}20`, border: `1px solid ${s.color}40`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.3rem", flexShrink: 0
                            }}>{s.icon}</div>
                            <div>
                                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--glass-border)" }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: "0.75rem 1.25rem",
                                borderRadius: "10px 10px 0 0",
                                background: activeTab === tab.id ? "var(--glass)" : "transparent",
                                color: activeTab === tab.id ? "var(--text-main)" : "var(--text-muted)",
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                fontSize: "0.88rem",
                                border: "none",
                                borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >{tab.label}</button>
                    ))}
                </div>

                {loading && (
                    <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                        Loading...
                    </div>
                )}

                {/* ─── Tab: Pending Approvals ──────────────────────────── */}
                {!loading && activeTab === "pending" && (
                    <div>
                        {pendingLeaves.length === 0 ? (
                            <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎉</div>
                                <p style={{ color: "var(--text-muted)", margin: 0 }}>No pending leave requests.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {pendingLeaves.map(leave => (
                                    <div key={leave._id} className="glass-panel" style={{
                                        padding: "1.5rem",
                                        borderLeft: "4px solid #f59e0b"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                                    <div style={{
                                                        width: "38px", height: "38px", borderRadius: "50%",
                                                        background: "rgba(79,70,229,0.15)",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontWeight: 800, fontSize: "0.9rem", color: "#818cf8", flexShrink: 0
                                                    }}>
                                                        {(leave.faculty?.name || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>
                                                            {leave.faculty?.name || "Unknown Faculty"}
                                                        </div>
                                                        <div style={{ fontSize: "0.78rem", color: "#818cf8" }}>
                                                            {leave.faculty?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ marginLeft: "50px" }}>
                                                    <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.3rem" }}>
                                                        📅 {new Date(leave.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                                    </div>
                                                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                                        "{leave.reason}"
                                                    </div>
                                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                                                        Submitted {new Date(leave.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "0.625rem", flexShrink: 0 }}>
                                                <button
                                                    onClick={() => handleLeaveStatus(leave._id, "APPROVED")}
                                                    disabled={processing[leave._id]}
                                                    id={`approve-${leave._id}`}
                                                    style={{
                                                        padding: "0.6rem 1.25rem",
                                                        background: "rgba(16,185,129,0.15)",
                                                        color: "#10b981",
                                                        border: "1px solid rgba(16,185,129,0.35)",
                                                        borderRadius: "10px",
                                                        fontWeight: 700,
                                                        fontSize: "0.85rem",
                                                        cursor: processing[leave._id] ? "not-allowed" : "pointer",
                                                        opacity: processing[leave._id] ? 0.5 : 1,
                                                        transition: "all 0.2s"
                                                    }}
                                                >
                                                    {processing[leave._id] ? "⏳ Processing..." : "✅ Approve"}
                                                </button>
                                                <button
                                                    onClick={() => handleLeaveStatus(leave._id, "REJECTED")}
                                                    disabled={processing[leave._id]}
                                                    id={`reject-${leave._id}`}
                                                    style={{
                                                        padding: "0.6rem 1.25rem",
                                                        background: "rgba(239,68,68,0.12)",
                                                        color: "#ef4444",
                                                        border: "1px solid rgba(239,68,68,0.3)",
                                                        borderRadius: "10px",
                                                        fontWeight: 700,
                                                        fontSize: "0.85rem",
                                                        cursor: processing[leave._id] ? "not-allowed" : "pointer",
                                                        opacity: processing[leave._id] ? 0.5 : 1,
                                                        transition: "all 0.2s"
                                                    }}
                                                >
                                                    ❌ Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Tab: Action Required (Conflicts) ────────────────── */}
                {!loading && activeTab === "conflicts" && (
                    <div>
                        {approvedLeaves.length === 0 ? (
                            <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
                                <p style={{ color: "var(--text-muted)", margin: 0 }}>All conflicts resolved! No action required.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                {approvedLeaves.map(leave => (
                                    <div key={leave._id} className="glass-panel" style={{ padding: "1.75rem", borderLeft: "4px solid #ef4444" }}>
                                        {/* Leave meta */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                                    <div style={{
                                                        padding: "0.25rem 0.6rem",
                                                        background: "rgba(239,68,68,0.15)",
                                                        color: "#ef4444",
                                                        borderRadius: "8px",
                                                        fontSize: "0.72rem",
                                                        fontWeight: 700
                                                    }}>⚠️ ACTION REQUIRED</div>
                                                </div>
                                                <h3 style={{ margin: "0 0 0.3rem", fontSize: "1.05rem" }}>
                                                    {leave.faculty?.name} is on leave
                                                </h3>
                                                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                                    📅 {new Date(leave.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                                    &nbsp;&nbsp;·&nbsp;&nbsp;
                                                    {leave.conflictResolution?.conflictCount} class conflict{leave.conflictResolution?.conflictCount > 1 ? "s" : ""}
                                                </div>
                                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem", fontStyle: "italic" }}>
                                                    Reason: "{leave.reason}"
                                                </div>
                                            </div>
                                        </div>

                                        {/* Conflict slots */}
                                        <div>
                                            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                Affected Classes — Assign Substitutes
                                            </div>
                                            {leave.conflictResolution?.resolutions?.map((resolution, idx) => (
                                                <ConflictSlotCard
                                                    key={idx}
                                                    conflict={resolution.conflict}
                                                    resolution={resolution}
                                                    leaveId={leave._id}
                                                    leaveDate={leave.date}
                                                    leaveFacultyId={leave.faculty?._id || leave.faculty}
                                                    department={leave.department}
                                                    onAssigned={handleSubAssigned}
                                                />
                                            ))}
                                            {(!leave.conflictResolution?.resolutions?.length) && (
                                                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                                    No resolution data available. Try re-approving the leave.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Tab: Substitution Log ────────────────────────────── */}
                {!loading && activeTab === "log" && (
                    <div>
                        {subLog.length === 0 ? (
                            <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📋</div>
                                <p style={{ color: "var(--text-muted)", margin: 0 }}>No substitution records yet.</p>
                            </div>
                        ) : (
                            <div className="glass-panel" style={{ overflow: "hidden" }}>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                                                {["Date", "Day & Time", "Subject", "Original Faculty", "Substitute", "Assigned By", "Status", "Actions"].map(h => (
                                                    <th key={h} style={{
                                                        padding: "0.875rem 1rem", textAlign: "left",
                                                        color: "var(--text-muted)", fontWeight: 600, fontSize: "0.78rem",
                                                        textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap"
                                                    }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subLog.map((log, idx) => (
                                                <tr key={log._id} style={{
                                                    borderBottom: idx < subLog.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                                    transition: "background 0.15s"
                                                }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                                                        {new Date(log.leaveDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                                                        <div style={{ fontWeight: 600 }}>{log.day}</div>
                                                        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{log.time}</div>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ fontWeight: 600 }}>{log.subjectName || "—"}</div>
                                                        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{log.timetableName}</div>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{ color: "#ef4444" }}>🚫 {log.originalFacultyName}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{ color: "#10b981" }}>✅ {log.substituteFacultyName}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", color: "var(--text-muted)" }}>
                                                        {log.assignedBy?.name || "—"}
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{
                                                            padding: "2px 8px",
                                                            borderRadius: "8px",
                                                            fontSize: "0.72rem",
                                                            fontWeight: 700,
                                                            background: log.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : "rgba(148,163,184,0.15)",
                                                            color: log.status === "ACTIVE" ? "#10b981" : "#94a3b8"
                                                        }}>{log.status}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        {log.status === "ACTIVE" && (
                                                            <button
                                                                onClick={() => handleRevert(log._id)}
                                                                disabled={revertingId === log._id}
                                                                style={{
                                                                    padding: "0.35rem 0.75rem",
                                                                    background: "rgba(239,68,68,0.1)",
                                                                    color: "#ef4444",
                                                                    border: "1px solid rgba(239,68,68,0.25)",
                                                                    borderRadius: "8px",
                                                                    cursor: revertingId === log._id ? "not-allowed" : "pointer",
                                                                    fontSize: "0.78rem",
                                                                    fontWeight: 600,
                                                                    opacity: revertingId === log._id ? 0.5 : 1
                                                                }}
                                                            >
                                                                {revertingId === log._id ? "..." : "↩ Revert"}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <style>{`
                @keyframes slideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
