import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function Faculty() {
  const [faculty, setFaculty] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    designation: ""
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchFaculty();
    loadDepartments();
  }, []);

  const loadDepartments = () => {
    const saved = localStorage.getItem("departments");
    if (saved) {
      setDepartments(JSON.parse(saved));
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await fetch("/api/faculty");
      const data = await res.json();
      setFaculty(data);
    } catch (error) {
      console.error("Error fetching faculty:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ name: "", email: "", department: "", designation: "" });
        fetchFaculty();
      }
    } catch (error) {
      console.error("Error creating faculty:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/faculty/${id}`, { method: "DELETE" });
      fetchFaculty();
    } catch (error) {
      console.error("Error deleting faculty:", error);
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Faculty</h1>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>

          {/* Form */}
          <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
            <h2 style={{ marginTop: 0 }}>Add Faculty</h2>
            <form onSubmit={handleSubmit}>
              <input
                className="input-field"
                name="name"
                placeholder="Faculty Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                className="input-field"
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <select
                className="input-field"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
              <input
                className="input-field"
                name="designation"
                placeholder="Designation"
                value={formData.designation}
                onChange={handleChange}
              />
              <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                Add Faculty
              </button>
            </form>
          </div>

          {/* List */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h2 style={{ marginTop: 0 }}>Faculty List</h2>
            <input
              type="text"
              className="input-field"
              placeholder="Search faculty by name, email, department, or designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: "1rem" }}
            />
            {loading ? <p>Loading...</p> : (
              <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "0.5rem" }}>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {faculty
                    .filter(f =>
                      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (f.designation && f.designation.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((f) => (
                      <div key={f._id} style={{
                        background: "rgba(255,255,255,0.05)",
                        padding: "1rem",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div>
                          <h3 style={{ margin: "0 0 0.5rem 0" }}>{f.name}</h3>
                          <p style={{ margin: 0, color: "var(--text-muted)" }}>
                            {f.department} • {f.designation}
                          </p>
                          <small style={{ color: "var(--text-muted)" }}>{f.email}</small>
                        </div>
                        <button
                          onClick={() => handleDelete(f._id)}
                          style={{ color: "#ef4444", background: "none", fontSize: "1.2rem" }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
