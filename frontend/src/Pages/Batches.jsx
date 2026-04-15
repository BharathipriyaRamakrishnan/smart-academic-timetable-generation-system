import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function Batches() {
    const [batches, setBatches] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        department: "",
        studentsCount: ""
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchBatches();
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

    const fetchBatches = async () => {
        try {
            const res = await fetch("/api/batches");
            const data = await res.json();
            setBatches(data);
        } catch (error) {
            console.error("Error fetching batches:", error);
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
            const url = editingId ? `/api/batches/${editingId}` : "/api/batches";
            const method = editingId ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setFormData({
                    name: "",
                    department: "",
                    studentsCount: ""
                });
                setEditingId(null);
                fetchBatches();
                alert(`Batch ${editingId ? "updated" : "added"} successfully!`);
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error(`Error ${editingId ? "updating" : "creating"} batch:`, error);
            alert(`An error occurred while ${editingId ? "updating" : "creating"} batch.`);
        }
    };

    const handleEdit = (batch) => {
        setEditingId(batch._id);
        setFormData({
            name: batch.name,
            department: batch.department,
            studentsCount: batch.studentsCount
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ name: "", department: "", studentsCount: "" });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/api/batches/${id}`, { method: "DELETE" });
            fetchBatches();
        } catch (error) {
            console.error("Error deleting batch:", error);
        }
    };

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">Batches</h1>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>

                    {/* Form */}
                    <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h2 style={{ margin: 0 }}>{editingId ? "Edit Batch" : "Add Batch"}</h2>
                            {editingId && (
                                <button onClick={cancelEdit} style={{ background: "transparent", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <input
                                className="input-field"
                                name="name"
                                placeholder="Batch Name (e.g. 2023-2027)"
                                value={formData.name}
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
                                name="studentsCount"
                                type="number"
                                placeholder="Student Count"
                                value={formData.studentsCount}
                                onChange={handleChange}
                                required
                            />

                            <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                                {editingId ? "Update Batch" : "Add Batch"}
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="glass-panel" style={{ padding: "1.5rem" }}>
                        <h2 style={{ marginTop: 0 }}>Batch List</h2>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search batches by name or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ marginBottom: "1rem" }}
                        />
                        {loading ? <p>Loading...</p> : (
                            <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "0.5rem" }}>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    {batches
                                        .filter(b =>
                                            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            b.department.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .map((b) => (
                                            <div key={b._id} style={{
                                                background: "rgba(255,255,255,0.05)",
                                                padding: "1rem",
                                                borderRadius: "8px",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center"
                                            }}>
                                                <div>
                                                    <h3 style={{ margin: "0 0 0.5rem 0" }}>{b.name} - {b.department}</h3>
                                                    <p style={{ margin: 0, color: "var(--text-muted)" }}>
                                                        {b.studentsCount} Students
                                                    </p>
                                                </div>
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <button
                                                        onClick={() => handleEdit(b)}
                                                        style={{ color: "#3b82f6", background: "none", fontSize: "1rem" }}
                                                        title="Edit"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(b._id)}
                                                        style={{ color: "#ef4444", background: "none", fontSize: "1.2rem" }}
                                                        title="Delete"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
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
