import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function Faculty() {
  const [faculty, setFaculty] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    subjects: [] // Array of IDs
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchFaculty();
    fetchSubjects();
    loadDepartments();
  }, []);

  const loadDepartments = () => {
    const saved = localStorage.getItem("departments");
    if (saved) {
      setDepartments(JSON.parse(saved));
    } else {
      // Fallback default departments
      const defaults = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"];
      setDepartments(defaults);
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

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubjectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, subjects: selectedOptions });
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
        setFormData({ name: "", email: "", department: "", designation: "", subjects: [] });
        fetchFaculty();
        alert("Faculty added successfully!");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error creating faculty:", error);
      alert("An error occurred while creating faculty.");
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

              <label style={{ display: "block", marginBottom: "0.5rem" }}>Select Subjects (Ctrl/Cmd + Click):</label>
              <select
                className="input-field"
                name="subjects"
                multiple
                value={formData.subjects}
                onChange={handleSubjectChange}
                style={{ height: "100px" }}
              >
                {subjects.map(sub => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} ({sub.codes?.join(", ") || sub.code})
                  </option>
                ))}
              </select>
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
                          <small style={{ display: "block", color: "var(--text-muted)" }}>{f.email}</small>
                          <small style={{ color: "var(--text-muted)" }}>
                            Teaches: {f.subjects?.map(s => s.name).join(", ") || "None"}
                          </small>
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
