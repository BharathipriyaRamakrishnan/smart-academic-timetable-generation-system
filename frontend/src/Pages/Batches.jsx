import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function Batches() {
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        department: "",
        semester: "",
        section: "",
        studentsCount: "",
        subjects: [] // Array of IDs
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBatches();
        fetchSubjects();
    }, []);

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
            const res = await fetch("/api/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setFormData({
                    name: "",
                    department: "",
                    semester: "",
                    section: "",
                    studentsCount: "",
                    subjects: []
                });
                fetchBatches();
            }
        } catch (error) {
            console.error("Error creating batch:", error);
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
                            <input
                                className="input-field"
                                name="department"
                                placeholder="Department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                            />
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <input
                                    className="input-field"
                                    name="semester"
                                    type="number"
                                    placeholder="Sem"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    className="input-field"
                                    name="section"
                                    placeholder="Section"
                                    value={formData.section}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <input
                                className="input-field"
                                name="studentsCount"
                                type="number"
                                placeholder="Student Count"
                                value={formData.studentsCount}
                                onChange={handleChange}
                                required
                            />

                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Select Subjects:</label>
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
                                        {sub.name} ({sub.code})
                                    </option>
                                ))}
                            </select>
                            <small style={{ display: "block", marginBottom: "1rem", color: "var(--text-muted)" }}>Hold Ctrl/Cmd to select multiple</small>

                            <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                                Add Batch
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="glass-panel" style={{ padding: "1.5rem" }}>
                        <h2 style={{ marginTop: 0 }}>Batch List</h2>
                        {loading ? <p>Loading...</p> : (
                            <div style={{ display: "grid", gap: "1rem" }}>
                                {batches.map((b) => (
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
                                                Sem {b.semester} • Section {b.section} • {b.studentsCount} Students
                                            </p>
                                            <small style={{ color: "var(--text-muted)" }}>{b.subjects?.length || 0} Subjects Assigned</small>
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
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
