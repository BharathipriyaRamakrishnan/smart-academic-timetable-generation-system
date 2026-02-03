import { useState } from "react";

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
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">Coordinator Panel</div>

        <nav>
          <button className="nav-item active">Dashboard</button>
          <button className="nav-item">Subjects</button>
          <button className="nav-item">Constraints</button>
          <button className="nav-item">Generate Timetable</button>
        </nav>

        <button className="logout">Logout</button>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Header */}
        <div className="header">
          <h1>Coordinator Dashboard</h1>
          <p>Manage Department Timetables & Constraints</p>
        </div>

        {/* Year Selector */}
        <section className="content">
          <h2>Select Academic Year</h2>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            {years.map((year) => (
              <button
                key={year}
                className={`nav-item ${selectedYear === year ? "active" : ""}`}
                onClick={() => setSelectedYear(year)}
                style={{ borderRadius: "20px" }}
              >
                Year {year}
              </button>
            ))}
          </div>

          {/* Departments List */}
          <h2>Departments Under Your Coordination</h2>

          <div className="stats">
            {departments[selectedYear].map((dept) => (
              <div key={dept} className="card">
                <h3>Department</h3>
                <p>{dept}</p>

                <div style={{ marginTop: "16px" }}>
                  <button className="actions button">
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
