import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    type: "Lecture Hall",
    resources: ""
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await fetch("/api/classrooms");
      const data = await res.json();
      setClassrooms(data);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
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
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          resources: formData.resources.split(",").map(r => r.trim())
        }),
      });
      if (res.ok) {
        setFormData({ name: "", capacity: "", type: "Lecture Hall", resources: "" });
        fetchClassrooms();
        alert("Classroom added successfully!");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error creating classroom:", error);
      alert("An error occurred while creating classroom.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/classrooms/${id}`, { method: "DELETE" });
      fetchClassrooms();
    } catch (error) {
      console.error("Error deleting classroom:", error);
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Classrooms</h1>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>

          {/* Form */}
          <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
            <h2 style={{ marginTop: 0 }}>Add Classroom</h2>
            <form onSubmit={handleSubmit}>
              <input
                className="input-field"
                name="name"
                placeholder="Room Name/Number"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                className="input-field"
                name="capacity"
                type="number"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
              <select
                className="input-field"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="Lecture Hall">Lecture Hall</option>
                <option value="Laboratory">Laboratory</option>
              </select>
              <input
                className="input-field"
                name="resources"
                placeholder="Resources (comma separated)"
                value={formData.resources}
                onChange={handleChange}
              />
              <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                Add Classroom
              </button>
            </form>
          </div>

          {/* List */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h2 style={{ marginTop: 0 }}>All Classrooms</h2>
            <input
              type="text"
              className="input-field"
              placeholder="Search classrooms by name, type, or resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: "1rem" }}
            />
            {loading ? <p>Loading...</p> : (
              <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "0.5rem" }}>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {classrooms
                    .filter(room =>
                      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      room.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      room.resources.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((room) => (
                      <div key={room._id} style={{
                        background: "rgba(255,255,255,0.05)",
                        padding: "1rem",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div>
                          <h3 style={{ margin: "0 0 0.5rem 0" }}>{room.name}</h3>
                          <p style={{ margin: 0, color: "var(--text-muted)" }}>
                            {room.type} • Capacity: {room.capacity}
                          </p>
                          <small style={{ color: "var(--text-muted)" }}>{room.resources.join(", ")}</small>
                        </div>
                        <button
                          onClick={() => handleDelete(room._id)}
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
