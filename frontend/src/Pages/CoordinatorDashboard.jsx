import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import { FaCalendarTimes, FaCheck, FaTimes, FaBell } from "react-icons/fa";

export default function CoordinatorDashboard() {
  const [selectedYear, setSelectedYear] = useState("1");
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  const years = ["1", "2", "3", "4"];
  const department = localStorage.getItem("department") || "CSE";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDepartmentLeaves();
  }, []);

  const fetchDepartmentLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const res = await fetch(`/api/leaves/department/${department}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLeaves(data);
    } catch (error) {
      console.error("Error fetching department leaves:", error);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleLeaveStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/leaves/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchDepartmentLeaves();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating leave status:", error);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === "PENDING");

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Coordinator Dashboard</h1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ padding: "0.5rem 1rem", background: "rgba(79, 70, 229, 0.1)", borderRadius: "20px", color: "#818cf8" }}>
              Department: {department}
            </span>
            {pendingLeaves.length > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 1rem",
                background: "rgba(245, 158, 11, 0.15)",
                color: "#f59e0b",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: 600,
                animation: "pulse 2s infinite"
              }}>
                <FaBell /> {pendingLeaves.length} Pending Leave{pendingLeaves.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem" }}>
          <div>
            {/* Year Selector */}
            <section className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
              <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Select Academic Year</h2>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {years.map((year) => (
                  <button
                    key={year}
                    className={selectedYear === year ? "btn-primary" : ""}
                    onClick={() => setSelectedYear(year)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "12px",
                      background: selectedYear === year ? "" : "rgba(255,255,255,0.05)",
                      color: selectedYear === year ? "white" : "var(--text-muted)",
                      border: "1px solid var(--glass-border)",
                      transition: "all 0.2s"
                    }}
                  >
                    Year {year}
                  </button>
                ))}
              </div>
            </section>

            {/* Departments List */}
            <section>
              <h2 style={{ marginBottom: "1.5rem" }}>Manage Timetable</h2>
              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <h3 style={{ marginTop: 0, color: "var(--secondary)" }}>{department} Department</h3>
                <p style={{ color: "var(--text-muted)" }}>Generate and manage academic schedules for this department.</p>

                <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
                  <button className="btn-primary" onClick={() => window.location.href = '/timetable'}>
                    Open Timetable Builder
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div>
            {/* Leave Management Notification Area */}
            <section className="glass-panel" style={{ padding: "1.5rem", minHeight: "100%" }}>
              <h2 style={{ fontSize: "1.25rem", marginTop: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <FaCalendarTimes color="#f59e0b" /> Faculty Leaves
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {loadingLeaves ? (
                  <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading...</p>
                ) : leaves.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                    No leave requests found for your department.
                  </p>
                ) : (
                  leaves.map(leave => (
                    <div key={leave._id} style={{
                      padding: "1rem",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "12px",
                      border: leave.status === "PENDING" ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(255,255,255,0.05)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "white" }}>{leave.faculty?.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "#818cf8" }}>{new Date(leave.date).toLocaleDateString()}</div>
                        </div>
                        {leave.status === "PENDING" ? (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button 
                              onClick={() => handleLeaveStatus(leave._id, "APPROVED")}
                              style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "rgba(16,185,129,0.2)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                              title="Approve"
                            >
                              <FaCheck size={12} />
                            </button>
                            <button 
                              onClick={() => handleLeaveStatus(leave._id, "REJECTED")}
                              style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "rgba(239,68,68,0.2)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                              title="Reject"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ 
                            fontSize: "0.7rem", 
                            fontWeight: 700, 
                            color: leave.status === "APPROVED" ? "#10b981" : "#ef4444",
                            textTransform: "uppercase"
                          }}>
                            {leave.status}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
                        " {leave.reason} "
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
