import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function FacultyLeaves() {
    const [leaves, setLeaves] = useState([]);
    const [leaveDate, setLeaveDate] = useState("");
    const [leaveReason, setLeaveReason] = useState("");
    const [submittingLeave, setSubmittingLeave] = useState(false);

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchLeaves();
    }, []);

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

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div>
                        <h1 className="page-title">Leave Management</h1>
                        <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 0 0", fontSize: "0.95rem" }}>Apply for and track your leave requests.</p>
                    </div>
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

            </main>
        </div>
    );
}
