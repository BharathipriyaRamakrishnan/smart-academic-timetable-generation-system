import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function Batches() {
    const [batches, setBatches] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        department: "",
        studentsCount: ""
    });
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
            const res = await fetch("/api/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setFormData({
                    name: "",
                    department: "",
                    studentsCount: ""
                });
                fetchBatches();
                alert("Batch added successfully!");
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error creating batch:", error);
            alert("An error occurred while creating batch.");
        }
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
                        <h2 style={{ marginTop: 0 }}>Add Batch</h2>
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
                                Add Batch
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
                                                <button
                                                    onClick={() => handleDelete(b._id)}
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
