import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import { FaClock } from "react-icons/fa";

export default function FacultyDashboard() {
    const [timetables, setTimetables] = useState([]);
    const [activeBatch, setActiveBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Leave state
    const [leaves, setLeaves] = useState([]);
    const [leaveDate, setLeaveDate] = useState("");
    const [leaveReason, setLeaveReason] = useState("");
    const [submittingLeave, setSubmittingLeave] = useState(false);

    const token = localStorage.getItem("token");
    const department = localStorage.getItem("department");

    useEffect(() => {
        fetchTimetables();
        fetchLeaves();
    }, []);

    const fetchTimetables = async () => {
        try {
            const res = await fetch("/api/timetables", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            const filtered = Array.isArray(data) && department
                ? data.filter(t => t.department === department)
                : (Array.isArray(data) ? data : []);

            setTimetables(filtered);
            if (filtered.length > 0) setActiveBatch(filtered[0]._id);
        } catch (error) {
            console.error("Error fetching timetables:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaves = async () => {
        try {
            const res = await fetch("/api/leaves/my", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setLeaves(data);
        } catch (error) {
            console.error("Error fetching leaves:", error);
        }
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        if (!leaveDate || !leaveReason) return;

        setSubmittingLeave(true);
        try {
            const res = await fetch("/api/leaves", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ date: leaveDate, reason: leaveReason })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Leave request submitted successfully!");
                setLeaveDate("");
                setLeaveReason("");
                fetchLeaves();
            } else {
                alert(data.message || "Failed to submit leave request");
            }
        } catch (error) {
            console.error("Error submitting leave:", error);
            alert("An error occurred");
        } finally {
            setSubmittingLeave(false);
        }
    };

    const currentTimetable = timetables.find(t => t._id === activeBatch);

    const cellColor = (slot) => {
        if (!slot) return { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.05)" };
        if (slot.type === "Break" || slot.type === "Lunch") return { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.3)" };
        if (slot.type === "Free") return { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" };
        if (slot.type === "Lab") return { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" };
        return { bg: "rgba(79,70,229,0.18)", border: "rgba(79,70,229,0.35)" };
    };

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">My Timetable</h1>
                    {department && (
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.4rem 1rem",
                            background: "rgba(79, 70, 229, 0.1)",
                            borderRadius: "20px",
                            color: "#818cf8",
                            fontSize: "0.9rem"
                        }}>
                            Department: <strong>{department}</strong>
                        </div>
                    )}
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                    {/* Apply for Leave */}
                    <div className="glass-panel" style={{ padding: "1.5rem" }}>
                        <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>📅 Apply for Leave</h3>
                        <form onSubmit={handleLeaveSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Select Date</label>
                                <input 
                                    type="date" 
                                    className="input-field" 
                                    style={{ margin: 0 }}
                                    value={leaveDate}
                                    onChange={(e) => setLeaveDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Reason</label>
                                <textarea 
                                    className="input-field" 
                                    placeholder="Brief reason for leave..."
                                    style={{ margin: 0, minHeight: "80px", resize: "none" }}
                                    value={leaveReason}
                                    onChange={(e) => setLeaveReason(e.target.value)}
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={submittingLeave}
                                style={{ width: "100%", padding: "0.75rem" }}
                            >
                                {submittingLeave ? "Submitting..." : "Submit Leave Request"}
                            </button>
                        </form>
                    </div>

                    {/* Leave Status */}
                    <div className="glass-panel" style={{ padding: "1.5rem" }}>
                        <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>📜 My Leave Requests</h3>
                        <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {leaves.length === 0 ? (
                                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "1rem" }}>
                                    No leave requests found.
                                </p>
                            ) : (
                                leaves.map(leave => (
                                    <div key={leave._id} style={{
                                        padding: "1rem",
                                        background: "rgba(255,255,255,0.05)",
                                        borderRadius: "8px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        border: "1px solid rgba(255,255,255,0.05)"
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                                                {new Date(leave.date).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                                {leave.reason}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            background: leave.status === "APPROVED" ? "rgba(16,185,129,0.15)" : 
                                                        leave.status === "REJECTED" ? "rgba(239,68,68,0.15)" : 
                                                        "rgba(245,158,11,0.15)",
                                            color: leave.status === "APPROVED" ? "#10b981" : 
                                                   leave.status === "REJECTED" ? "#ef4444" : 
                                                   "#f59e0b",
                                            border: `1px solid ${
                                                leave.status === "APPROVED" ? "#10b98140" : 
                                                leave.status === "REJECTED" ? "#ef444440" : 
                                                "#f59e0b40"
                                            }`
                                        }}>
                                            {leave.status}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <h2 style={{ fontSize: "1.25rem", margin: 0 }}>📅 Class Timetable</h2>
                </div>

                {loading ? (
                    <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                        <p style={{ color: "var(--text-muted)" }}>Loading timetables...</p>
                    </div>
                ) : timetables.length === 0 ? (
                    <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                        <FaClock style={{ fontSize: "3rem", color: "var(--text-muted)", marginBottom: "1rem" }} />
                        <h3>No Timetables Available</h3>
                        <p style={{ color: "var(--text-muted)" }}>
                            Timetables will appear here once they are generated by the admin or coordinator.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                        {/* Batch Selector Tabs */}
                        <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem", flexWrap: "wrap" }}>
                            {timetables.map(t => (
                                <button
                                    key={t._id}
                                    onClick={() => setActiveBatch(t._id)}
                                    style={{
                                        background: activeBatch === t._id ? "var(--primary)" : "rgba(255,255,255,0.08)",
                                        color: "white",
                                        padding: "0.5rem 1.2rem",
                                        borderRadius: "20px",
                                        border: activeBatch === t._id ? "none" : "1px solid var(--glass-border)",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        fontSize: "0.875rem",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {t.name} {t.semester ? `· Sem ${t.semester}` : ""}
                                </button>
                            ))}
                        </div>

                        {/* Timetable Grid */}
                        {currentTimetable && (() => {
                            const allTimes = [];
                            const seenTimes = new Set();
                            currentTimetable.schedule.forEach(daySch => {
                                daySch.slots.forEach(slot => {
                                    if (!seenTimes.has(slot.time)) {
                                        seenTimes.add(slot.time);
                                        allTimes.push(slot.time);
                                    }
                                });
                            });
                            allTimes.sort();

                            const days = currentTimetable.schedule.map(d => d.day);

                            const slotMap = {};
                            currentTimetable.schedule.forEach(daySch => {
                                slotMap[daySch.day] = {};
                                daySch.slots.forEach(slot => {
                                    slotMap[daySch.day][slot.time] = slot;
                                });
                            });

                            return (
                                <div className="glass-panel" style={{ padding: "1.5rem", overflowX: "auto" }}>
                                    {/* Header */}
                                    <div style={{ marginBottom: "1.25rem" }}>
                                        <h2 style={{ marginTop: 0, marginBottom: "0.25rem" }}>{currentTimetable.name}</h2>
                                        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
                                            {currentTimetable.department} &nbsp;•&nbsp; Semester {currentTimetable.semester}
                                            {currentTimetable.section ? ` • Section ${currentTimetable.section}` : ""}
                                        </p>
                                    </div>

                                    {/* Legend */}
                                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                                        {[
                                            { label: "Lecture",      bg: "rgba(79,70,229,0.18)",   border: "rgba(79,70,229,0.35)" },
                                            { label: "Lab",          bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.3)" },
                                            { label: "Break/Lunch",  bg: "rgba(234,179,8,0.15)",   border: "rgba(234,179,8,0.3)" },
                                            { label: "Study Period", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" },
                                        ].map(({ label, bg, border }) => (
                                            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                                <div style={{ width: 14, height: 14, background: bg, border: `1px solid ${border}`, borderRadius: 3 }} />
                                                {label}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Grid */}
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px", minWidth: `${days.length * 140 + 110}px` }}>
                                            <thead>
                                                <tr>
                                                    <th style={{
                                                        padding: "0.6rem 1rem",
                                                        textAlign: "left",
                                                        background: "rgba(255,255,255,0.05)",
                                                        borderRadius: "6px",
                                                        fontSize: "0.8rem",
                                                        color: "var(--text-muted)",
                                                        whiteSpace: "nowrap"
                                                    }}>
                                                        Time
                                                    </th>
                                                    {days.map(day => (
                                                        <th key={day} style={{
                                                            padding: "0.6rem 1rem",
                                                            textAlign: "center",
                                                            background: "rgba(79,70,229,0.2)",
                                                            borderRadius: "6px",
                                                            fontSize: "0.85rem",
                                                            fontWeight: 600,
                                                            color: "#a5b4fc",
                                                            whiteSpace: "nowrap"
                                                        }}>
                                                            {day}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allTimes.map(time => (
                                                    <tr key={time}>
                                                        <td style={{
                                                            padding: "0.5rem 0.75rem",
                                                            fontSize: "0.78rem",
                                                            color: "var(--text-muted)",
                                                            whiteSpace: "nowrap",
                                                            background: "rgba(255,255,255,0.03)",
                                                            borderRadius: "6px",
                                                            fontWeight: 500
                                                        }}>
                                                            {time}
                                                        </td>
                                                        {days.map(day => {
                                                            const slot = slotMap[day]?.[time];
                                                            const isBreak = slot?.type === "Break" || slot?.type === "Lunch";
                                                            const isFree  = slot?.type === "Free";
                                                            const colors = cellColor(slot);
                                                            return (
                                                                <td key={day} style={{ padding: "2px" }}>
                                                                    <div style={{
                                                                        background: colors.bg,
                                                                        border: `1px solid ${colors.border}`,
                                                                        borderRadius: "6px",
                                                                        padding: "0.5rem 0.625rem",
                                                                        minHeight: "62px",
                                                                        display: "flex",
                                                                        flexDirection: "column",
                                                                        justifyContent: "center",
                                                                        gap: "2px"
                                                                    }}>
                                                                        {isBreak ? (
                                                                            <span style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 600, textAlign: "center" }}>
                                                                                {slot.type === "Lunch" ? "🍽" : "☕"} {slot.type === "Lunch" ? "Lunch Break" : "Break"}
                                                                            </span>
                                                                        ) : isFree ? (
                                                                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", textAlign: "center", fontStyle: "italic" }}>
                                                                                📖 Study Period
                                                                            </span>
                                                                        ) : slot?.subject ? (
                                                                            <>
                                                                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", lineHeight: 1.2 }}>
                                                                                    {slot.subject?.name || "—"}
                                                                                </div>
                                                                                {slot.subject?.codes?.[0] && (
                                                                                    <div style={{ fontSize: "0.68rem", color: "#a5b4fc", fontWeight: 500 }}>
                                                                                        {slot.subject.codes[0]}
                                                                                    </div>
                                                                                )}
                                                                                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                                                                                    👤 {slot.faculty?.name || "—"}
                                                                                </div>
                                                                                {slot.classroom?.name && (
                                                                                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                                                                                        🏛 {slot.classroom.name}
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.15)", textAlign: "center" }}>—</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </main>
        </div>
    );
}
