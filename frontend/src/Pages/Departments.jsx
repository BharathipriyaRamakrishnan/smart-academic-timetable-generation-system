import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import { FaBuilding, FaPlus, FaTrash } from "react-icons/fa";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = () => {
    // Load from localStorage (simple approach since no backend model)
    const saved = localStorage.getItem("departments");
    if (saved) {
      setDepartments(JSON.parse(saved));
    } else {
      // Default departments
      const defaults = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"];
      setDepartments(defaults);
      localStorage.setItem("departments", JSON.stringify(defaults));
    }
  };

  const saveDepartments = (depts) => {
    localStorage.setItem("departments", JSON.stringify(depts));
    setDepartments(depts);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newDept.trim()) return;

    if (departments.includes(newDept.trim())) {
      alert("Department already exists!");
      return;
    }

    const updated = [...departments, newDept.trim()];
    saveDepartments(updated);
    setNewDept("");
  };

  const handleDelete = (dept) => {
    if (!confirm(`Delete "${dept}"? This won't affect existing faculty/subjects.`)) return;

    const updated = departments.filter(d => d !== dept);
    saveDepartments(updated);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Departments</h1>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>

          {/* Add Form */}
          <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FaPlus /> Add Department
            </h2>
            <form onSubmit={handleAdd}>
              <input
                className="input-field"
                placeholder="Department Name (e.g., Computer Science)"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                Add Department
              </button>
            </form>

            <div style={{
              marginTop: "1.5rem",
              padding: "1rem",
              background: "rgba(59, 130, 246, 0.1)",
              borderRadius: "8px",
              borderLeft: "3px solid rgb(59, 130, 246)"
            }}>
              <small style={{ color: "var(--text-muted)" }}>
                <strong>Note:</strong> Departments are used when adding Faculty and Subjects.
                They help organize your academic structure.
              </small>
            </div>
          </div>

          {/* List */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FaBuilding /> Departments List
            </h2>

            {departments.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
                No departments added yet.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {departments.map((dept, index) => (
                  <div
                    key={index}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      padding: "1rem 1.5rem",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid var(--glass-border)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{
                        background: "rgba(139, 92, 246, 0.2)",
                        color: "rgb(139, 92, 246)",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        fontSize: "1.2rem"
                      }}>
                        <FaBuilding />
                      </div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{dept}</h3>
                    </div>
                    <button
                      onClick={() => handleDelete(dept)}
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"}
                      onMouseOut={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
