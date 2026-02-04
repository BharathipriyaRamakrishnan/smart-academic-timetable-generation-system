import { useState } from "react";
import Sidebar from "../Components/Sidebar";

export default function CoordinatorDashboard() {
  const [selectedYear, setSelectedYear] = useState("1");

  const years = ["1", "2", "3", "4"];

  // Example departments — later comes from backend
  const departments = {
    "1": ["CSE", "ECE", "EEE"],
    "2": ["CSE", "ECE"],
    "3": ["CSE"],
    "4": ["CSE"]
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Coordinator Dashboard</h1>
          <div style={{ display: "flex", gap: "1rem" }}>
            <span style={{ padding: "0.5rem 1rem", background: "rgba(79, 70, 229, 0.1)", borderRadius: "20px", color: "#818cf8" }}>
              Department: {localStorage.getItem("department") || "CSE"} (Assigned)
            </span>
          </div>
        </header>

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
          <h2 style={{ marginBottom: "1.5rem" }}>Your Department Overview</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {departments[selectedYear].map((dept) => (
              <div key={dept} className="glass-panel" style={{ padding: "1.5rem" }}>
                <h3 style={{ marginTop: 0, color: "var(--secondary)" }}>{dept} Department</h3>
                <p style={{ color: "var(--text-muted)" }}>Manage student groups, faculty assignments, and constraints for this department.</p>

                <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
                  <button className="btn-primary" onClick={() => window.location.href = '/timetable'}>
                    Open Timetable Builder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
