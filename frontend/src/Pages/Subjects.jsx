import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        credits: "",
        type: "Core",
        department: "",
        semester: "",
        lecturesPerWeek: ""
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await fetch("/api/subjects");
            const data = await res.json();
            setSubjects(data);
        } catch (error) {
            console.error("Error fetching subjects:", error);
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
            const res = await fetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setFormData({
                    name: "",
                    code: "",
                    credits: "",
                    type: "Core",
                    department: "",
                    semester: "",
                    lecturesPerWeek: ""
                });
                fetchSubjects();
            }
        } catch (error) {
            console.error("Error creating subject:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/api/subjects/${id}`, { method: "DELETE" });
            fetchSubjects();
        } catch (error) {
            console.error("Error deleting subject:", error);
        }
    };

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">Subjects</h1>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>

                    {/* Form */}
                    <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
                        <h2 style={{ marginTop: 0 }}>Add Subject</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                className="input-field"
                                name="name"
                                placeholder="Subject Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <input
                                className="input-field"
                                name="code"
                                placeholder="Subject Code"
                                value={formData.code}
                                onChange={handleChange}
                                required
                            />
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <input
                                    className="input-field"
                                    name="credits"
                                    type="number"
                                    placeholder="Credits"
                                    value={formData.credits}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    className="input-field"
                                    name="semester"
                                    type="number"
                                    placeholder="Sem"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <select
                                className="input-field"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                            >
                                <option value="Core">Core</option>
                                <option value="Elective">Elective</option>
                                <option value="Lab">Lab</option>
                            </select>
                            <input
                                className="input-field"
                                name="department"
                                placeholder="Department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                            />
                            <input
                                className="input-field"
                                name="lecturesPerWeek"
                                type="number"
                                placeholder="Lectures/Week"
                                value={formData.lecturesPerWeek}
                                onChange={handleChange}
                                required
                            />
                            <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                                Add Subject
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="glass-panel" style={{ padding: "1.5rem" }}>
                        <h2 style={{ marginTop: 0 }}>Subject List</h2>
                        {loading ? <p>Loading...</p> : (
                            <div style={{ display: "grid", gap: "1rem" }}>
                                {subjects.map((s) => (
                                    <div key={s._id} style={{
                                        background: "rgba(255,255,255,0.05)",
                                        padding: "1rem",
                                        borderRadius: "8px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}>
                                        <div>
                                            <h3 style={{ margin: "0 0 0.5rem 0" }}>{s.name} ({s.code})</h3>
                                            <p style={{ margin: 0, color: "var(--text-muted)" }}>
                                                {s.department} • Sem {s.semester} • {s.credits} Credits
                                            </p>
                                            <small style={{ color: "var(--text-muted)" }}>{s.type} • {s.lecturesPerWeek} Lectures/Week</small>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(s._id)}
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
