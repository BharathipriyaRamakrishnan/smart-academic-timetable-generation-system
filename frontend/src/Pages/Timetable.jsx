import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function Timetable() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeBatch, setActiveBatch] = useState(null);

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      const res = await fetch("/api/timetables");
      const data = await res.json();
      setTimetables(data);
      if (data.length > 0) setActiveBatch(data[0]._id);
    } catch (error) {
      console.error("Error fetching timetables:", error);
    }
  };

  const generateTimetable = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/timetables/generate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Refresh list
        fetchTimetables();
        alert("Timetable generated successfully!");
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error generating timetable:", error);
      alert("Failed to generate timetable.");
    } finally {
      setLoading(false);
    }
  };

  const currentTimetable = timetables.find(t => t._id === activeBatch);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Timetables</h1>
          <button
            className="btn-primary"
            onClick={generateTimetable}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate New Timetable"}
          </button>
        </header>

        {timetables.length === 0 ? (
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
            <p>No timetables found. Click "Generate New Timetable" to create one.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Batch Selector */}
            <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
              {timetables.map(t => (
                <button
                  key={t._id}
                  onClick={() => setActiveBatch(t._id)}
                  style={{
                    background: activeBatch === t._id ? "var(--primary)" : "rgba(255,255,255,0.1)",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "20px",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {t.name} (Sem {t.semester})
                </button>
              ))}
            </div>

            {/* Timetable View */}
            {currentTimetable && (
              <div className="glass-panel" style={{ padding: "1.5rem", overflowX: "auto" }}>
                <h2 style={{ marginTop: 0 }}>{currentTimetable.name} - Timetable</h2>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "1rem", borderBottom: "1px solid var(--glass-border)" }}>Day</th>
                      {currentTimetable.schedule[0]?.slots.map((slot, index) => (
                        <th key={index} style={{ textAlign: "left", padding: "1rem", borderBottom: "1px solid var(--glass-border)" }}>
                          {slot.time}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentTimetable.schedule.map((daySch, dIndex) => (
                      <tr key={dIndex}>
                        <td style={{ padding: "1rem", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          {daySch.day}
                        </td>
                        {daySch.slots.map((slot, sIndex) => (
                          <td key={sIndex} style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{
                              background: "rgba(79, 70, 229, 0.2)",
                              padding: "0.5rem",
                              borderRadius: "6px",
                              border: "1px solid rgba(79, 70, 229, 0.3)"
                            }}>
                              <div style={{ fontWeight: "600", fontSize: "0.9em" }}>{slot.subject?.name || "Subject"}</div>
                              <div style={{ fontSize: "0.8em", opacity: 0.8 }}>{slot.faculty?.name || "Faculty"}</div>
                              <div style={{ fontSize: "0.75em", opacity: 0.6 }}>{slot.classroom?.name || "Room"}</div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
